import { ActionCtx, internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { v } from "convex/values";

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
  notifyOnPriceIncrease: true,
  notifyOnNewTerms: true,
  maxAutoReplies: 3,
  notifyAfterRounds: 5,
};

// --- Core Agent Action --- 
export const runAgentNegotiation = internalAction({
    args: {
        negotiationId: v.id("negotiations"),
        bypassNewTermsCheck: v.optional(v.boolean()),
        bypassMaxRepliesCheck: v.optional(v.boolean()),
        bypassRoundsCheck: v.optional(v.boolean()),
        bypassPriceIncreaseCheck: v.optional(v.boolean()),
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

        // --- EARLY LOGGING --- 
        console.log(`[Agent] Early check for ${args.negotiationId}:`, {
            negotiationStatus: negotiation.status,
            isAgentActive: negotiation.isAgentActive,
            initialTargetPricePerKm: negotiation.agentTargetPricePerKm
        });
        // --- END EARLY LOGGING ---

        // Ensure agent is still supposed to be active
        if (!negotiation.isAgentActive) {
            console.warn(`[Agent] Agent is not active for negotiation ${args.negotiationId}. Stopping.`);
            return; 
        }
        
        // Validate the target price per km
        const targetPricePerKm = negotiation.agentTargetPricePerKm;
        if (!targetPricePerKm || targetPricePerKm <= 0) {
            console.error(`[Agent] Invalid target price per km (${targetPricePerKm}) for negotiation ${args.negotiationId}. Stopping.`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'error',
                reason: 'Invalid target price per km. Please set a value greater than 0.',
            });
            return;
        }

        // 2. Basic state checks
        if (negotiation.status !== 'pending') {
            console.log(`[Agent] Negotiation ${args.negotiationId} is no longer pending (${negotiation.status}). Deactivating agent.`);
            // Agent will be deactivated if status changes, no need to call configureAgent here again
            return;
        }
        
        // 3. Prepare context for LLM
        const history = negotiation.messages.map(msg => `${msg.sender}: ${msg.content}`).join("\n");
        const initialRequest = negotiation.initialRequest;
        const distanceStr = initialRequest.distance;
        let distance: number | null = null;
        try {
            // Use the robust parser
            distance = parseNumericValue(distanceStr); 
            console.log(`[Agent] Parsed distance: ${distance} from "${distanceStr}"`);
        } catch (error) { 
            console.error(`[Agent] Error parsing distance: ${error}`);
            distance = null; 
        }

        // Validate Distance
        if (distance === null || distance <= 0 || isNaN(distance)) {
            console.error(`[Agent] Invalid distance parsed (${distance}) for negotiation ${args.negotiationId}. Forcing review.`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'needs_review',
                reason: `Invalid or missing distance (${initialRequest.distance || 'Not provided'}). Agent cannot calculate target price.`,
            });
            return; // Stop processing
        }

        // Calculate TARGET TOTAL PRICE
        let targetTotalPrice = "N/A";
        if (distance !== null && targetPricePerKm !== null && distance > 0 && targetPricePerKm > 0) {
            const calculatedPrice = (distance * targetPricePerKm);
            console.log(`[Agent] Calculated target total price: ${calculatedPrice.toFixed(2)} EUR (distance=${distance}, targetPricePerKm=${targetPricePerKm})`);
            targetTotalPrice = calculatedPrice.toFixed(2) + " EUR";
        } else {
            console.warn(`[Agent] Could not calculate target total price: distance=${distance}, targetPricePerKm=${targetPricePerKm}`);
        }
            
        // Get LATEST TOTAL PRICE OFFER from carrier messages or counter offers
        let currentTotalPriceStr = "N/A";
        // Look in counterOffers first (non-user/non-agent)
        const latestCarrierOffer = negotiation.counterOffers
            .slice()
            .reverse()
            .find(o => o.proposedBy !== 'user' && o.proposedBy !== 'agent');

        if (latestCarrierOffer) {
            currentTotalPriceStr = latestCarrierOffer.price;
        } else {
            // If no counter offers, check messages BACKWARDS for price mentions by carrier
            const reversedCarrierMessages = negotiation.messages
                .slice()
                .reverse()
                .filter(m => m.sender !== 'user' && m.sender !== 'agent' && m.sender !== 'system');

            for (const message of reversedCarrierMessages) {
                // Basic regex to find a price like "1234 EUR" or "€1234.56"
                // Need to handle potential commas and dots flexibly
                 const priceRegex = /(?:€|EUR)?\\s*(\\d{1,3}(?:[,.]\\d{3})*(?:[.,]\\d{1,2})?)|(\\d{1,}(?:[.,]\\d{1,2})?)\\s*(?:€|EUR)/i; 
                 const priceMatch = message.content.match(priceRegex);
                 
                 if (priceMatch) {
                    // Extract the number part (group 1 or 2, preferring group 1 if both somehow match)
                    const priceValue = priceMatch[1] || priceMatch[2]; 
                    if (priceValue) {
                         // Use robust parser to normalize and validate
                         const parsedPrice = parseNumericValue(priceValue); 
                         if (parsedPrice !== null) {
                            currentTotalPriceStr = parsedPrice.toFixed(2) + " EUR"; // Standardize format
                            console.log(`[Agent] Found latest carrier price ${currentTotalPriceStr} in message: "${message.content}"`);
                            break; // Stop searching once found
                         }
                    }
                }
            }
        }
        // Fallback to initial if no other price found after searching offers and messages
        if (currentTotalPriceStr === "N/A") {
            currentTotalPriceStr = initialRequest.price;
            console.log("[Agent] No carrier price found in offers or messages, falling back to initial price.");
        }

        // Calculate Current Price Per Km (now uses robust parser via calculatePricePerKm)
        const currentPricePerKm = calculatePricePerKm(currentTotalPriceStr, distanceStr ?? '');
        
        // --- Log calculated values before prompt ---
        console.log(`[Agent] Values for LLM Prompt for ${args.negotiationId}:`,
        {
            targetTotalPrice,
            currentTotalPriceStr,
            targetPricePerKm: targetPricePerKm ?? 'N/A',
            currentPricePerKm: currentPricePerKm ?? 'N/A'
        });

        // --- Construct the messages array for the Chat API --- 
        const systemMessageContent = `
You are an AI negotiation agent representing the freight customer.
Your goal is to negotiate the TOTAL PRICE for this transport down to ${targetTotalPrice} or lower.
Your negotiation style should be: ${agentConfig.style}.
(${agentConfig.style === "conservative" ? "Prioritize relationship, be flexible."
  : agentConfig.style === "aggressive" ? "Focus strongly on target price, be firm."
  : "Seek fair terms, balance price and relationship."})

CRITICAL INSTRUCTION: Your response MUST refer *ONLY* to the absolute total price (${targetTotalPrice}). You MUST NOT mention or use any price per kilometer (EUR/km) value in your message to the carrier. Repeat: DO NOT MENTION EUR/km.

CRITICAL RULE: IF the provided 'TARGET TOTAL PRICE' is EXACTLY 'N/A' or EXACTLY '0.00 EUR', you MUST NOT generate a message. Your ONLY allowed action is to output the JSON: { "action": "needs_review", "reason": "Invalid target total price provided by system." }

CRITICAL RULE (Agreement Check): If the LATEST message from the other party indicates AGREEMENT with the TARGET TOTAL PRICE (${targetTotalPrice}) (e.g., mentions price <= target, uses words like yes, ok, agree, accept, confirm, deal, settle, approved, 'alright', 'lets do it', or implies acceptance), you MUST output the JSON: { "action": "needs_review", "reason": "Price agreement detected or target price achieved." }. Do NOT proceed to formulate a response message.

CRITICAL RULE (Output Format): Respond ONLY with a JSON object containing:
{ 
  "action": "send_message" | "needs_review" | "error",
  "newTermsDetected": true | false, // Set based on analysis ONLY if not reviewing due to agreement or invalid price.
  "messageContent": "<Your proposed message text using ONLY the absolute TOTAL PRICE (${targetTotalPrice}), following the example structure and sounding natural. Ensure NO EUR/km is mentioned.>",
  "reason": "<Reason if action is needs_review or error. MUST use specific reasons for agreement/invalid price if applicable.>"
}

General Guidelines:
- Communicate as if you ARE the customer, using first person pronouns ("I", "we", "our").
- Don't thank the carrier for proposals unless they've made a significant concession.
- Sound Natural: Avoid starting every message the exact same way. Vary sentence structure. Only repeat the origin/destination if necessary for clarity.
`;

        const userMessageContent = `
Offer Details:
Origin: ${initialRequest.origin}
Destination: ${initialRequest.destination}
Distance: ${initialRequest.distance}
Initial Total Price: ${initialRequest.price}
Load: ${initialRequest.loadType || 'N/A'}, ${initialRequest.weight || 'N/A'}
Notes: ${initialRequest.notes || 'N/A'}
Known Carrier: ${initialRequest.carrier || 'N/A'}
Offer Contact: ${initialRequest.offerContactEmail || 'N/A'}

Current Status:
TARGET TOTAL PRICE: ${targetTotalPrice}
Latest Offered Total Price: ${currentTotalPriceStr} 
Negotiation Status: ${negotiation.status}
Message Count: ${negotiation.messages.length}
Agent Replies So Far: ${negotiation.agentReplyCount || 0}

Conversation History (latest message first):
${negotiation.messages.slice().reverse().map(msg => `${msg.sender}: ${msg.content}`).join("\n")}
------
Task: Analyze the LATEST message from the other party. If it's a simple refusal without new information (like 'no', 'i cant', 'not possible'), reiterate the need for the target price (${targetTotalPrice}) concisely. Otherwise, follow the system prompt rules to determine the correct JSON output (checking for agreement, new terms, or formulating a response towards the target).

Example Response Formulation (if needed):
If needing to send a message, follow this structure (adapting tone to style '${agentConfig.style}'):
"Thanks for the updated price. However, we still need to get closer to ${targetTotalPrice} for this shipment. Is that something you can manage?"

First Message Special Case:
If this is the first agent message (check Message Count/Agent Replies), introduce the topic clearly, like: "Regarding the transport from ${initialRequest.origin} to ${initialRequest.destination}, we're interested but need the total price to be ${targetTotalPrice} to proceed." DO NOT start with thanks.
For subsequent messages, respond directly to their latest point.
`;

        const messagesForAPI = [
            { role: "system" as const, content: systemMessageContent },
            { role: "user" as const, content: userMessageContent }
        ];

        console.log(`[Agent] Prompting LLM for negotiation ${args.negotiationId} using Chat API structure.`);

        // 4. Call OpenAI Endpoint using the new action
        let agentResponseJson: { 
            action: string; 
            newTermsDetected?: boolean; // Make optional for safety
            messageContent?: string; 
            reason?: string 
        };
        let llmSuggestedAction: string | null = null;
        let llmNewTermsDetected: boolean = false; // Default to false
        let llmMessageContent: string | null = null;
        let llmReason: string | null = null;
        
        try {
            // Call the new internal action with the messages array
            const llmResultString = await ctx.runAction(internal.openai.generateChatCompletion, { 
                messages: messagesForAPI,
            });
            
            // Parse the JSON string response from the action
            const llmResponse = JSON.parse(llmResultString);
            llmSuggestedAction = llmResponse.action;
            llmNewTermsDetected = llmResponse.newTermsDetected === true; // Explicitly check for true
            llmMessageContent = llmResponse.messageContent;
            llmReason = llmResponse.reason;

        } catch (error: any) {
            console.error(`[Agent] Error calling OpenAI action or parsing response for ${args.negotiationId}:`, error);
            // If LLM/parsing fails, force error state
            llmSuggestedAction = "error";
            llmReason = `LLM Action/Parsing Error: ${error.message}`;
            llmNewTermsDetected = false; // Ensure it's false on error
        }

        // --- Apply Notification Rules --- 
        let finalAction = llmSuggestedAction;
        let finalReason = llmReason;
        const currentReplyCount = negotiation.agentReplyCount || 0;

        // Rule 1: Max Auto Replies (unless bypass flag is set)
        if (finalAction === "send_message" && 
            agentConfig.maxAutoReplies !== 999 && 
            currentReplyCount >= agentConfig.maxAutoReplies && 
            !args.bypassMaxRepliesCheck) {
            console.log(`[Agent] Max auto-replies (${agentConfig.maxAutoReplies}) reached for ${args.negotiationId}. Forcing review.`);
            finalAction = "needs_review";
            finalReason = `Maximum automatic replies (${agentConfig.maxAutoReplies}) reached.`;
        }
        
        // Rule 2: Notify After Rounds (unless bypass flag is set)
        const totalMessages = negotiation.messages.length; 
        if (finalAction === "send_message" && 
            agentConfig.notifyAfterRounds > 0 && 
            (totalMessages + 1) % (agentConfig.notifyAfterRounds * 2) === 0 && // Check if the *next* message completes a round pair
            !args.bypassRoundsCheck) {
             console.log(`[Agent] Notification round (${agentConfig.notifyAfterRounds}) reached for ${args.negotiationId}. Forcing review.`);
             finalAction = "needs_review";
             finalReason = `Reached notification point after ${agentConfig.notifyAfterRounds} rounds.`;
        }
        
        // Rule 3: Notify on New Terms (unless bypass flag is set)
        if (finalAction === "send_message" && 
            agentConfig.notifyOnNewTerms && 
            llmNewTermsDetected && 
            !args.bypassNewTermsCheck) {
            console.log(`[Agent] New terms detected by LLM for ${args.negotiationId}. Forcing review.`);
            finalAction = "needs_review";
            finalReason = llmReason && llmReason.toLowerCase().includes("term") 
                            ? llmReason 
                            : "New terms mentioned by carrier."; 
        }

        // Rule 4: Notify on Price Increase (moves away from target)
        if (finalAction === "send_message" && agentConfig.notifyOnPriceIncrease && !args.bypassPriceIncreaseCheck) {
            const priceHistory = getCounterpartyPriceHistory(negotiation);
            if (priceHistory.length >= 2) {
                const latestPriceEntry = priceHistory[priceHistory.length - 1];
                const previousPriceEntry = priceHistory[priceHistory.length - 2];
                
                // Get the timestamp of the latest non-user/non-agent/non-system message
                const lastCounterpartyMessage = negotiation.messages
                                                    .slice()
                                                    .reverse()
                                                    .find(m => m.sender !== 'user' && m.sender !== 'agent' && m.sender !== 'system');
                                                    
                const lastCounterpartyMessageTimestamp = lastCounterpartyMessage?.timestamp ?? 0;
                
                console.log(`[Agent] Price Increase Check: Latest=${latestPriceEntry.value}, Previous=${previousPriceEntry.value}, ` +
                            `Latest Price Timestamp=${latestPriceEntry.timestamp}, Last Message Timestamp=${lastCounterpartyMessageTimestamp}`);

                // Trigger ONLY if the latest price is higher AND it was introduced at or after the latest counterparty message timestamp
                // (Add a small buffer like 100ms to handle near-simultaneous processing)
                if (latestPriceEntry.value > previousPriceEntry.value && 
                    latestPriceEntry.timestamp >= (lastCounterpartyMessageTimestamp - 100)) {
                    console.log(`[Agent] Price increase detected in latest message/offer for ${args.negotiationId}. Forcing review.`);
                    finalAction = "needs_review";
                    finalReason = `Price increased by counterparty (from ${previousPriceEntry.value.toFixed(2)} to ${latestPriceEntry.value.toFixed(2)}) in their last communication.`;
                } else if (latestPriceEntry.value > previousPriceEntry.value) {
                   console.log(`[Agent] Price increase detected in history, but not in the latest message/offer. Proceeding.`); 
                }
            }
        }

        // -----------------------------

        // 5. Process Final Agent Action
        console.log(`[Agent] Final action determined: ${finalAction}`, { reason: finalReason });
        agentResponseJson = { 
          action: finalAction ?? "error", 
          // Include newTermsDetected in the final object if needed downstream, otherwise it's processed above
          messageContent: finalAction === "send_message" ? llmMessageContent ?? undefined : undefined,
          reason: finalReason ?? "Unknown processing error" 
        }; // Construct final JSON based on rules

        const routeName = `${initialRequest.origin} to ${initialRequest.destination}`;

        if (agentResponseJson.action === "send_message" && agentResponseJson.messageContent) {
            // Agent wants to send a message
            const agentMessage = agentResponseJson.messageContent;
            
            // Increment reply count BEFORE adding the message
            const newReplyCount = await ctx.runMutation(internal.negotiations.incrementAgentReplyCount, { 
              negotiationId: args.negotiationId 
            });
            console.log(`[Agent] Incremented reply count for ${args.negotiationId} to ${newReplyCount}`);

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

        } else if (agentResponseJson.action === "needs_review") {
            // Agent flags for user review
            console.log(`[Agent] Flagging negotiation ${args.negotiationId} for review. Reason: ${agentResponseJson.reason}`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'needs_review',
                reason: agentResponseJson.reason, 
            });
            
            // Determine notification type based on reason
            let notificationType: "agent_needs_review" | "agent_new_terms" = "agent_needs_review";
            if (agentResponseJson.reason && agentResponseJson.reason.toLowerCase().includes("term")) {
                notificationType = "agent_new_terms";
            }
            
            // Create a notification for the user
            await ctx.runMutation(internal.notifications.createNotification, {
                userId: negotiation.userId,
                type: notificationType,
                title: `${notificationType === 'agent_new_terms' ? 'New Terms Mentioned' : 'AI Agent Needs Review'}: ${routeName}`,
                content: agentResponseJson.reason || "Your attention is needed on this negotiation.",
                sourceId: args.negotiationId,
                sourceName: routeName
            });
            console.log(`[Agent] Created notification (type: ${notificationType}) for user ${negotiation.userId} about review needed`);

        } else {
            // Handle error state
            console.error(`[Agent] Error state reached for ${args.negotiationId}: ${agentResponseJson.reason || 'Unknown error'}`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'error',
                reason: agentResponseJson.reason,
            });
            
            // Also create an error notification
            await ctx.runMutation(internal.notifications.createNotification, {
                userId: negotiation.userId,
                type: "agent_needs_review", // Using generic review type for errors
                title: `AI Agent Error: ${routeName}`,
                content: agentResponseJson.reason || "There was an error processing the AI agent response. Please check the negotiation.",
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