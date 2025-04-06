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

// Helper function to calculate price per km (adapt based on actual data structure)
function calculatePricePerKm(priceStr: string, distanceStr: string): number | null {
    try {
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        const distance = parseFloat(distanceStr.replace(/[^0-9.,]/g, "").replace(",", ".")); // Handle comma decimal separator
        if (isNaN(price) || isNaN(distance) || distance === 0) {
            return null;
        }
        return price / distance;
    } catch (error) {
        console.error("Error calculating price/km:", error);
        return null;
    }
}

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

        // Ensure agent is still supposed to be active
        if (!negotiation.isAgentActive || !negotiation.agentTargetPricePerKm) {
            console.warn(`[Agent] Agent is not active or target price is missing for negotiation ${args.negotiationId}. Stopping.`);
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
        const targetPricePerKm = negotiation.agentTargetPricePerKm;
        const currentPricePerKm = calculatePricePerKm(
            negotiation.counterOffers.slice(-1)[0]?.price || initialRequest.price, 
            initialRequest.distance || "0"
        );

        // --- Construct the prompt --- 
        let prompt = `You are an AI negotiation agent representing the freight customer.
        Your goal is to negotiate the price per kilometer down to ${targetPricePerKm.toFixed(2)} EUR/km or lower.
        Your negotiation style should be: ${agentConfig.style}. 
        (${agentConfig.style === "conservative" ? "Prioritize relationship, be flexible."
         : agentConfig.style === "aggressive" ? "Focus strongly on target price, be firm."
         : "Seek fair terms, balance price and relationship."})
        Be direct, professional, and assertive according to your style. Don't be unnecessarily thankful or apologetic.
        
        Communicate as if you ARE the customer, using first person pronouns ("I", "we", "our").
        Don't thank the carrier for proposals unless they've made a significant concession.

        Offer Details:
        Origin: ${initialRequest.origin}
        Destination: ${initialRequest.destination}
        Distance: ${initialRequest.distance}
        Initial Price: ${initialRequest.price}
        Load: ${initialRequest.loadType || 'N/A'}, ${initialRequest.weight || 'N/A'}
        Notes: ${initialRequest.notes || 'N/A'}

        Current Status:
        Target Price/km: ${targetPricePerKm.toFixed(2)} EUR/km
        Current Price/km: ${currentPricePerKm ? currentPricePerKm.toFixed(2) + ' EUR/km' : 'N/A'}
        Negotiation Status: ${negotiation.status}
        Message Count: ${negotiation.messages.length}
        Agent Replies So Far: ${negotiation.agentReplyCount || 0}

        Conversation History:
        ${history}
        ------
        Write a direct message to negotiate toward the target price (${targetPricePerKm.toFixed(2)} EUR/km), keeping your style (${agentConfig.style}) in mind.
        
        IMPORTANT: Check if this is your first message in the conversation:
        - If message count is 0 or there are no prior messages from you, DO NOT use phrases like "I appreciate the proposal" or "Thank you for considering". 
        - For first contact, START WITH: "Regarding your offer for the ${initialRequest.origin} to ${initialRequest.destination} route. We are interested but..."

        Messaging guidelines:
        1. If this is the first message, directly state what price you're willing to pay and why it's fair, according to your style.
        2. If they made a counter-offer, evaluate if it's getting closer to target. Respond according to your style (e.g., aggressive might push harder, conservative might accept smaller steps).
        3. Use specific numbers - don't be vague. Reference specific route/load details to justify your position.
        4. If they mention constraints or reasons they can't lower the price, address those specifically.
        5. If you've gone back and forth several times with little movement, consider flagging for human review, especially if your style is conservative or balanced.
        6. Always position your price as fair market value, not just what you want to pay.

        Respond ONLY with a JSON object containing:
        { 
          "action": "send_message" | "needs_review" | "error",
          "messageContent": "<Your proposed message text if action is send_message>",
          "reason": "<Reason if action is needs_review or error>"
        }
        AI Agent:`; 

        console.log(`[Agent] Prompting LLM for negotiation ${args.negotiationId}`);

        // 4. Call OpenAI Endpoint
        let agentResponseJson: { action: string; messageContent?: string; reason?: string };
        let llmSuggestedAction: string | null = null;
        let llmMessageContent: string | null = null;
        let llmReason: string | null = null;
        
        try {
            // Call the internal action to get the completion from OpenAI
            const llmResultString = await ctx.runAction(internal.openai.generateCompletion, {
                prompt: prompt,
            });
            
            // Parse the JSON string response from the action
            const llmResponse = JSON.parse(llmResultString);
            llmSuggestedAction = llmResponse.action;
            llmMessageContent = llmResponse.messageContent;
            llmReason = llmResponse.reason;

        } catch (error: any) {
            console.error(`[Agent] Error calling OpenAI action or parsing response for ${args.negotiationId}:`, error);
            // If LLM/parsing fails, force error state
            llmSuggestedAction = "error";
            llmReason = `LLM Action/Parsing Error: ${error.message}`;
        }

        // --- Apply Notification Rules --- 
        let finalAction = llmSuggestedAction;
        let finalReason = llmReason;
        const currentReplyCount = negotiation.agentReplyCount || 0;

        // Rule 1: Max Auto Replies
        // Check if the *next* reply would exceed the limit
        if (finalAction === "send_message" && agentConfig.maxAutoReplies !== 999 && currentReplyCount >= agentConfig.maxAutoReplies) {
            console.log(`[Agent] Max auto-replies (${agentConfig.maxAutoReplies}) reached for ${args.negotiationId}. Forcing review.`);
            finalAction = "needs_review";
            finalReason = `Maximum automatic replies (${agentConfig.maxAutoReplies}) reached.`;
        }
        
        // Rule 2: Notify After Rounds (assuming 1 round = 1 user msg + 1 agent msg)
        // Check if the total message count reaches a notification point
        // (This is a simple round estimate, could be refined)
        const totalMessages = negotiation.messages.length; 
        if (finalAction === "send_message" && agentConfig.notifyAfterRounds > 0 && (totalMessages + 1) % (agentConfig.notifyAfterRounds * 2) === 0) {
             console.log(`[Agent] Notification round (${agentConfig.notifyAfterRounds}) reached for ${args.negotiationId}. Forcing review.`);
             finalAction = "needs_review";
             finalReason = `Reached notification point after ${agentConfig.notifyAfterRounds} rounds.`;
        }
        
        // TODO: Implement checks for notifyOnPriceIncrease and notifyOnNewTerms
        // This likely requires asking the LLM to analyze the last message 
        // or comparing current state vs previous state.

        // -----------------------------

        // 5. Process Final Agent Action
        console.log(`[Agent] Final action determined: ${finalAction}`, { reason: finalReason });
        agentResponseJson = { 
          action: finalAction ?? "error", 
          messageContent: finalAction === "send_message" ? llmMessageContent ?? undefined : undefined,
          reason: finalReason ?? "Unknown processing error" 
        }; // Construct final JSON based on rules

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
            // Keep agent status as 'negotiating'
            // Status update only happens on review/error or external change

        } else if (agentResponseJson.action === "needs_review") {
            // Agent flags for user review
            console.log(`[Agent] Flagging negotiation ${args.negotiationId} for review. Reason: ${agentResponseJson.reason}`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'needs_review',
                reason: agentResponseJson.reason, 
            });
            
            // Create a notification for the user
            const routeName = `${initialRequest.origin} to ${initialRequest.destination}`;
            await ctx.runMutation(internal.notifications.createNotification, {
                userId: negotiation.userId,
                type: "agent_needs_review",
                title: `AI Agent Needs Review: ${routeName}`,
                content: agentResponseJson.reason || "Your attention is needed on this negotiation.",
                sourceId: args.negotiationId,
                sourceName: routeName
            });
            console.log(`[Agent] Created notification for user ${negotiation.userId} about review needed`);

        } else {
            // Handle error state
            console.error(`[Agent] Error state reached for ${args.negotiationId}: ${agentResponseJson.reason || 'Unknown error'}`);
            await ctx.runMutation(internal.negotiations.updateAgentStatus, { 
                negotiationId: args.negotiationId,
                status: 'error',
                reason: agentResponseJson.reason,
            });
            
            // Also create an error notification
            const routeName = `${initialRequest.origin} to ${initialRequest.destination}`;
            await ctx.runMutation(internal.notifications.createNotification, {
                userId: negotiation.userId,
                type: "agent_needs_review", // Using same type for now
                title: `AI Agent Error: ${routeName}`,
                content: agentResponseJson.reason || "There was an error with your AI agent. Please check the negotiation.",
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