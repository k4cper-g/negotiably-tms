import { ActionCtx, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { executeNegotiationAgent, NegotiationAgentState } from "./langGraphAgent";

// Helper function to get environment variables or throw
function getEnvVariable(varName: string): string {
    const value = process.env[varName];
    if (value === undefined) {
        throw new Error(`Required environment variable "${varName}" is not set.`);
    }
    return value;
}

// --- Robust Number Parsing Helper (Simplified) ---
function parseNumericValue(str: string | null | undefined): number | null {
    if (str === null || str === undefined) return null;
    try {
        // 1. Remove everything except digits, comma, and dot.
        const cleaned = str.replace(/[^\d.,]/g, '');
        
        // 2. Remove all commas (treat as thousands separators).
        const withoutCommas = cleaned.replace(/,/g, '');
        
        // 3. Now, only dots remain (or no separator). ParseFloat handles this.
        const value = parseFloat(withoutCommas);
        
        return isNaN(value) ? null : value;

    } catch (error) {
        console.error(`Error parsing numeric value from string "${str}":`, error);
        return null;
    }
}
// --- End Robust Number Parsing Helper ---

// Helper function to calculate price per km (adapt based on actual data structure)
function calculatePricePerKm(priceStr: string, distanceStr: string): number | null {
    try {
        const price = parseNumericValue(priceStr);
        const distance = parseNumericValue(distanceStr);
        
        if (price === null || distance === null || isNaN(price) || isNaN(distance) || distance === 0) {
            console.log(`[Agent] Invalid price calculation inputs: price=${price}, distance=${distance}`);
            return null;
        }
        
        const pricePerKm = price / distance;
        console.log(`[Agent] Calculated price/km: ${pricePerKm.toFixed(2)} EUR/km (price=${price}, distance=${distance})`);
        return pricePerKm;
    } catch (error) {
        console.error("Error calculating price/km:", error);
        return null;
    }
}

// Helper to get timestamped prices from counterparty
const getCounterpartyPriceHistory = (negotiation: Doc<"negotiations">): { value: number, timestamp: number }[] => {
  const prices: { value: number, timestamp: number, source: string }[] = [];

  // 1. Add initial price as the baseline (timestamp 0 or createdAt)
  const initialPriceNum = parseNumericValue(negotiation.initialRequest.price);
  if (initialPriceNum !== null) {
      prices.push({ value: initialPriceNum, timestamp: negotiation._creationTime, source: 'initial' });
  }

  // 2. Add prices from counter offers not by user/agent
  negotiation.counterOffers.forEach(offer => {
    if (offer.proposedBy !== 'user' && offer.proposedBy !== 'agent') {
      const priceNum = parseNumericValue(offer.price);
      if (priceNum !== null) {
        prices.push({ value: priceNum, timestamp: offer.timestamp, source: `counter-${offer.proposedBy}` });
      }
    }
  });

  // 3. Add prices parsed from messages not by user/agent/system
  negotiation.messages.forEach(message => {
    if (message.sender !== 'user' && message.sender !== 'agent' && message.sender !== 'system') {
        // Regex to find potential price mentions (e.g., €123, 123 EUR, 123.45)
        const priceRegex = /(?:€|EUR)?\s*(\d+(?:[.,]\d+)?)/i; // Simpler regex focused on value
        const priceMatch = message.content.match(priceRegex);
        if (priceMatch && priceMatch[1]) { 
            const priceNum = parseNumericValue(priceMatch[1]); // Use robust parser on extracted value
            if (priceNum !== null) {
                prices.push({ value: priceNum, timestamp: message.timestamp, source: `message-${message.sender}` });
            }
        } 
    }
  });

  // 4. Sort by timestamp ascending
  prices.sort((a, b) => a.timestamp - b.timestamp);

  // 5. De-duplicate consecutive identical prices (optional but good)
  const uniquePrices = prices.filter((price, index, arr) => 
      index === 0 || price.value !== arr[index - 1].value
  );

  console.log("[Agent] Counterparty Price History (Sorted, Unique):");
  uniquePrices.forEach(p => console.log(`  - ${new Date(p.timestamp).toISOString()}: ${p.value} (Source: ${p.source})`));

  return uniquePrices.map(p => ({ value: p.value, timestamp: p.timestamp })); // Return only value and timestamp
};

// OpenAI API endpoint
const OPENAI_CHAT_COMPLETION_URL = "https://api.openai.com/v1/chat/completions";

// Default Agent Settings
const defaultAgentSettings = {
  style: "balanced" as const,
  notifyOnPriceChange: true,
  notifyOnNewTerms: true,
  maxAutoReplies: 3,
  notifyAfterRounds: 5,
  // New notification settings
  notifyOnTargetPriceReached: true,
  notifyOnAgreement: true,
  notifyOnConfusion: true,
  notifyOnRefusal: true,
};

// --- Core Agent Action --- 
export const runAgentNegotiation = internalAction({
    args: {
        negotiationId: v.id("negotiations"),
        bypassNewTermsCheck: v.optional(v.boolean()),
        bypassMaxRepliesCheck: v.optional(v.boolean()),
        bypassRoundsCheck: v.optional(v.boolean()),
        bypassPriceChangeCheck: v.optional(v.boolean()),
        // Add new bypass flags for remaining review conditions
        bypassTargetPriceCheck: v.optional(v.boolean()),
        bypassAgreementCheck: v.optional(v.boolean()),
        bypassConfusionCheck: v.optional(v.boolean()),
        bypassRefusalCheck: v.optional(v.boolean()),
    },
    handler: async (ctx: ActionCtx, args) => {
        console.log(`[Agent] Running for negotiation: ${args.negotiationId}`);

        // 1. Fetch latest negotiation state
        const negotiation = await ctx.runQuery(internal.negotiations.getNegotiationByIdInternal, { 
            negotiationId: args.negotiationId 
        });
        if (!negotiation) {
            console.error(`[Agent] Negotiation ${args.negotiationId} not found.`);
            return; // Stop processing
        }
        
        // Fetch agent configuration (or use defaults)
        const agentConfig = 
          (await ctx.runQuery(internal.agentConfigurations.getByNegotiationId, { negotiationId: args.negotiationId })) 
          ?? defaultAgentSettings;
          
        console.log(`[Agent] Using configuration:`, agentConfig);

        // Prepare our initial state for the LangGraph agent
        const initialState = {
                negotiationId: args.negotiationId,
            negotiationDoc: negotiation,
            agentConfig,
            latestMessage: null, // Will be identified by the startAgent node
            currentPriceInfo: {
                price: null,
                priceStr: null,
                source: 'none' as const,
                timestamp: Date.now(),
            },
            targetPriceInfo: {
                targetTotalEur: null,
                targetTotalStr: null,
                targetPerKm: negotiation.agentTargetPricePerKm || null,
            },
            analysisResult: {
                intent: 'other' as const,
                priceInMessage: null,
                newTermsDetected: false,
            },
            generatedMessage: null,
            finalAction: null,
            reviewReason: null,
            errorDetails: null,
        };

        // Add bypass flags if provided
        const bypasses = {
            bypassNewTermsCheck: args.bypassNewTermsCheck || false,
            bypassMaxRepliesCheck: args.bypassMaxRepliesCheck || false,
            bypassRoundsCheck: args.bypassRoundsCheck || false,
            bypassPriceChangeCheck: args.bypassPriceChangeCheck || false,
            // Include the new bypass flags
            bypassTargetPriceCheck: args.bypassTargetPriceCheck || false,
            bypassAgreementCheck: args.bypassAgreementCheck || false,
            bypassConfusionCheck: args.bypassConfusionCheck || false,
            bypassRefusalCheck: args.bypassRefusalCheck || false,
        };

        try {
            // Execute the LangGraph agent
            const result = await executeNegotiationAgent({
                ...initialState,
                // Include bypasses in the agent config
                agentConfig: {
                    ...agentConfig,
                    ...bypasses
                }
            });

            console.log(`[Agent] LangGraph execution completed with action: ${result.finalAction}`);

            // --- Update currentPrice in DB based on agent analysis --- 
            if (result.currentPriceInfo && result.currentPriceInfo.priceStr !== undefined) { 
                const analyzedPriceStr = result.currentPriceInfo.priceStr; // Can be null
                console.log(`[Agent] Scheduling update of currentPrice in DB to: ${analyzedPriceStr}`);
                await ctx.runMutation(internal.negotiations.updateCurrentPriceInternal, {
                    negotiationId: args.negotiationId,
                    newCurrentPrice: analyzedPriceStr, // Pass null if that's what analysis determined
                });
            } else {
                 console.warn(`[Agent] Could not update currentPrice in DB: Analysis result missing priceStr.`);
            }
            // -------------------------------------------------------

            // Process the final result based on the finalAction
            if (result.finalAction === 'send' && result.generatedMessage) {
            // Agent wants to send a message
                const agentMessage = result.generatedMessage;
            
            // Increment reply count BEFORE adding the message
            const newReplyCount = await ctx.runMutation(internal.negotiations.incrementAgentReplyCount, { 
              negotiationId: args.negotiationId 
            });
            console.log(`[Agent] Incremented reply count for ${args.negotiationId} to ${newReplyCount}`);

                // Set agent state to "negotiating" when successfully sending a message
                await ctx.runMutation(internal.negotiations.updateAgentStatus, {
                    negotiationId: args.negotiationId,
                    status: undefined, // This will clear the state field, indicating normal operation
                    reason: undefined, // Clear any previous error/review message
                });

            // Add agent message to chat via internal mutation
            await ctx.runMutation(internal.negotiations.addAgentMessage, { 
                negotiationId: args.negotiationId,
                content: agentMessage,
            });

            // Schedule email send
            await ctx.scheduler.runAfter(0, api.email.sendNegotiationUpdateEmail, { 
                negotiationId: args.negotiationId,
                messageContent: agentMessage,
                senderUserId: negotiation.userId, 
            });
            console.log(`[Agent] Added message and scheduled email for ${args.negotiationId}`);

            } else if (result.finalAction === 'review') {
            // Agent flags for user review
                console.log(`[Agent] Flagging negotiation ${args.negotiationId} for review. Reason: ${result.reviewReason}`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'needs_review',
                    reason: result.reviewReason as string, 
            });
            
            // Determine notification type based on reason
            let notificationType: "agent_needs_review" | "agent_new_terms" = "agent_needs_review";
                if (result.reviewReason && typeof result.reviewReason === 'string' && (result.reviewReason as string).toLowerCase().includes("term")) {
                notificationType = "agent_new_terms";
            }

                const routeName = `${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`;
            
            // Create a notification for the user
            await ctx.runMutation(internal.notifications.createNotification, {
                userId: negotiation.userId,
                type: notificationType,
                title: `${notificationType === 'agent_new_terms' ? 'New Terms Mentioned' : 'AI Agent Needs Review'}: ${routeName}`,
                    content: typeof result.reviewReason === 'string' ? result.reviewReason : "Your attention is needed on this negotiation.",
                sourceId: args.negotiationId,
                sourceName: routeName
            });
            console.log(`[Agent] Created notification (type: ${notificationType}) for user ${negotiation.userId} about review needed`);

            } else if (result.finalAction === 'error' || !result.finalAction) {
            // Handle error state
                const errorMessage = result.errorDetails || 'Unknown error during agent execution';
                console.error(`[Agent] Error state reached for ${args.negotiationId}: ${errorMessage}`);
                await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                    negotiationId: args.negotiationId,
                    status: 'error',
                    reason: errorMessage,
                });
                
                // Create an error notification
                const routeName = `${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`;
                await ctx.runMutation(internal.notifications.createNotification, {
                    userId: negotiation.userId,
                    type: "agent_needs_review", // Using generic review type for errors
                    title: `AI Agent Error: ${routeName}`,
                    content: errorMessage,
                    sourceId: args.negotiationId,
                    sourceName: routeName
                });
            } else {
                // This shouldn't happen, but handle it just in case
                console.error(`[Agent] Unexpected final action: ${result.finalAction}`);
                await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                    negotiationId: args.negotiationId,
                    status: 'error',
                    reason: 'Unexpected agent behavior. Please contact support.',
                });
            }
        } catch (error) {
            // Handle any unexpected errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during agent execution';
            console.error(`[Agent] Unhandled error: ${errorMessage}`, error);
            
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'error',
                reason: errorMessage,
            });
            
            // Create an error notification
            const routeName = `${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`;
            await ctx.runMutation(internal.notifications.createNotification, {
                userId: negotiation.userId,
                type: "agent_needs_review",
                title: `AI Agent Error: ${routeName}`,
                content: errorMessage,
                sourceId: args.negotiationId,
                sourceName: routeName
            });
        }
    }
});

// --- Helper mutation for updating agent status --- 
// (Consider adding reason field to schema if needed)
// export const updateAgentStatus = internalMutation({
//     args: {
//         negotiationId: v.id("negotiations"),
//         status: v.optional(v.string()),
//         reason: v.optional(v.string()), // Optional reason for status
//     },
//     handler: async (ctx, args) => {
//         await ctx.db.patch(args.negotiationId, {
//             agentStatus: args.status,
//             // agentErrorReason: args.reason, // Store reason if schema allows
//             updatedAt: Date.now(),
//         });
//     }
// }); 