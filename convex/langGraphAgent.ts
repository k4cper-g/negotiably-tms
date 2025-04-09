import { ChatOpenAI } from "@langchain/openai";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { FunctionMessage } from "@langchain/core/messages";
import { AIMessageChunk } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { Doc, Id } from "./_generated/dataModel";

// Type Definitions
export interface NegotiationAgentState {
    negotiationId: Id<"negotiations">;
    negotiationDoc: Doc<"negotiations"> | null;
    agentConfig: any; // Type from agentConfigurations
    latestMessage: any | null; // Latest message from the counterparty
    currentPriceInfo: {
        price: number | null;
        priceStr: string | null;
        source: 'message' | 'counterOffer' | 'initial' | 'none' | 'agreement' | 'llm_analysis' | 'error' | 'database';
        timestamp: number;
    };
    targetPriceInfo: {
        targetTotalEur: number | null;
        targetTotalStr: string | null;
        targetPerKm: number | null;
    };
    analysisResult: {
        intent: 'agreement' | 'refusal' | 'counter_proposal' | 'question' | 'new_terms' | 'other' | 'none' | 'error';
        priceInMessage: number | null;
        newTermsDetected: boolean;
        summary?: string;
    };
    generatedMessage: string | null;
    finalAction: 'send' | 'review' | 'error' | null;
    reviewReason: string | null;
    errorDetails: string | null;
}

// Utility Functions
// Extract numeric value from a string (price)
export function parseNumericValue(str: string | null | undefined): number | null {
    if (str === null || str === undefined) return null;
    try {
        const cleaned = str.replace(/[^\d.,]/g, '');
        const withoutCommas = cleaned.replace(/,/g, '');
        const value = parseFloat(withoutCommas);
        return isNaN(value) ? null : value;
    } catch (error) {
        console.error(`Error parsing numeric value from string "${str}":`, error);
        return null;
    }
}

// Calculate price per km
export function calculatePricePerKm(priceStr: string, distanceStr: string): number | null {
    try {
        const price = parseNumericValue(priceStr);
        const distance = parseNumericValue(distanceStr);
        
        if (price === null || distance === null || isNaN(price) || isNaN(distance) || distance === 0) {
            console.log(`[Agent] Invalid price calculation inputs: price=${price}, distance=${distance}`);
            return null;
        }
        
        const pricePerKm = price / distance;
        return pricePerKm;
    } catch (error) {
        console.error("Error calculating price/km:", error);
        return null;
    }
}

// Get the history of prices from the counterparty
export function getCounterpartyPriceHistory(negotiation: Doc<"negotiations">): { value: number, timestamp: number }[] {
    const prices: { value: number, timestamp: number, source: string }[] = [];

    // Add initial price as baseline
    const initialPriceNum = parseNumericValue(negotiation.initialRequest.price);
    if (initialPriceNum !== null) {
        prices.push({ 
            value: initialPriceNum, 
            timestamp: negotiation._creationTime, 
            source: 'initial' 
        });
    }

    // Add prices from counter offers not by user/agent
    negotiation.counterOffers.forEach(offer => {
        if (offer.proposedBy !== 'user' && offer.proposedBy !== 'agent') {
            const priceNum = parseNumericValue(offer.price);
            if (priceNum !== null) {
                prices.push({ 
                    value: priceNum, 
                    timestamp: offer.timestamp, 
                    source: `counter-${offer.proposedBy}` 
                });
            }
        }
    });

    // Add prices from messages not from user/agent/system
    negotiation.messages.forEach(message => {
        if (message.sender !== 'user' && message.sender !== 'agent' && message.sender !== 'system') {
            // Regex to find potential price mentions (e.g., €123, 123 EUR, 123.45)
            const priceRegex = /(?:€|EUR)?\s*(\d+(?:[.,]\d+)?)/i; 
            const priceMatch = message.content.match(priceRegex);
            if (priceMatch && priceMatch[1]) { 
                const priceNum = parseNumericValue(priceMatch[1]);
                if (priceNum !== null) {
                    prices.push({ 
                        value: priceNum, 
                        timestamp: message.timestamp, 
                        source: `message-${message.sender}` 
                    });
                }
            } 
        }
    });

    // Sort by timestamp ascending
    prices.sort((a, b) => a.timestamp - b.timestamp);

    // De-duplicate consecutive identical prices
    const uniquePrices = prices.filter((price, index, arr) => 
        index === 0 || price.value !== arr[index - 1].value
    );

    return uniquePrices.map(p => ({ value: p.value, timestamp: p.timestamp }));
}

// Helper function to determine if we're a customer or carrier in this negotiation
function isNegotiatingAsCustomer(negotiation: Doc<"negotiations"> | null): boolean {
    // In this application, we're always representing the freight customer
    // This is a simple implementation, but could be enhanced for more complex scenarios
    
    // You could look at various properties to determine this:
    // 1. User role in the system
    // 2. Special flags in the negotiation document
    // 3. Direction of negotiation
    
    // For this version, we assume customer role by default
    // This ensures backward compatibility with existing logic
    
    if (!negotiation) {
        return true; // Default to customer
    }
    
    // Future enhancement: Add custom logic here to determine role
    // based on properties in the negotiation
    
    // For now, we're always a customer in this system
    return true;
}

// Helper function to determine negotiation direction
function shouldNegotiateDown(currentPrice: number | null, targetPrice: number | null): boolean {
    if (currentPrice === null || targetPrice === null) {
        console.log(`[LangGraph] Cannot determine negotiation direction. currentPrice=${currentPrice}, targetPrice=${targetPrice}. Defaulting to DOWN.`);
        return true; // Default direction
    }
    
    // If current price is higher than target, we need to negotiate DOWN
    const result = currentPrice > targetPrice;
    console.log(`[LangGraph] Negotiation direction determined: currentPrice=${currentPrice}, targetPrice=${targetPrice}, direction=${result ? 'DOWN' : 'UP'}`);
    return result;
}

// Node Functions (all will be async functions that receive state and return modified state)

// 1. startAgent - Entry point
export async function startAgent(state: NegotiationAgentState): Promise<Partial<NegotiationAgentState>> {
    console.log(`[LangGraph] Starting agent for negotiation: ${state.negotiationId}`);
    
    // Check preconditions
    if (!state.negotiationDoc) {
        return {
            finalAction: 'error',
            errorDetails: `Negotiation ${state.negotiationId} not found.`
        };
    }
    
    const negotiation = state.negotiationDoc;
    
    // Ensure agent is active
    if (!negotiation.isAgentActive) {
        return {
            finalAction: 'error',
            errorDetails: `Agent is not active for negotiation ${state.negotiationId}.`
        };
    }
    
    // Validate target price per km
    const targetPricePerKm = negotiation.agentTargetPricePerKm;
    console.log(`[LangGraph] Target price per km: ${targetPricePerKm}`);
    
    if (!targetPricePerKm || targetPricePerKm <= 0) {
        return {
            finalAction: 'error',
            errorDetails: `Invalid target price per km (${targetPricePerKm}).`
        };
    }
    
    // Check negotiation status
    if (negotiation.status !== 'pending') {
        return {
            finalAction: 'error',
            errorDetails: `Negotiation is no longer pending (current status: ${negotiation.status}).`
        };
    }
    
    // Parse distance and calculate target price
    const distanceStr = negotiation.initialRequest.distance;
    const distance = parseNumericValue(distanceStr);
    console.log(`[LangGraph] Distance: ${distanceStr} parsed as ${distance}`);
    
    // Validate distance
    if (distance === null || distance <= 0 || isNaN(distance)) {
        return {
            finalAction: 'error',
            errorDetails: `Invalid or missing distance (${distanceStr || 'Not provided'}). Agent cannot calculate target price.`
        };
    }
    
    // Calculate target total price
    const targetTotalEur = distance * targetPricePerKm;
    const targetTotalStr = `${targetTotalEur.toFixed(2)} EUR`;
    console.log(`[LangGraph] Calculated target price: ${targetTotalEur} EUR (${distance} × ${targetPricePerKm})`);
    
    // Find latest message from counterparty
    const latestMessage = negotiation.messages.length > 0
        ? [...negotiation.messages].reverse().find(
            m => m.sender !== 'user' && m.sender !== 'agent' && m.sender !== 'system'
          )
        : null;
    
    // Log this information for debugging
    if (latestMessage) {
        console.log(`[LangGraph] Found latest message from ${latestMessage.sender}: "${latestMessage.content.substring(0, 100)}${latestMessage.content.length > 100 ? '...' : ''}"`);
    } else {
        console.log(`[LangGraph] No messages from counterparty found`);
    }
    
    // Return updated state
    return {
        targetPriceInfo: {
            targetTotalEur,
            targetTotalStr,
            targetPerKm: targetPricePerKm
        },
        latestMessage
    };
}

// 2. analyzeLatestMessage - Analyze the latest message, determine current price, and decide if review is needed
export async function analyzeLatestMessage(state: NegotiationAgentState): Promise<Partial<NegotiationAgentState>> {
    console.log(`[LangGraph] Analyzing state & latest message for negotiation: ${state.negotiationId}`);

    if (!state.negotiationDoc || !state.agentConfig) {
        return {
            finalAction: 'error',
            errorDetails: 'Missing negotiation document or agent configuration for analysis.'
        };
    }

    const negotiation = state.negotiationDoc;
    const config = state.agentConfig;
    const latestMessage = state.latestMessage; // Can be null if no counterparty message yet

    try {
        const model = new ChatOpenAI({
            modelName: "gpt-4o", // Use a more capable model for complex reasoning
            temperature: 0.1 // Low temperature for consistent analysis
        });

        // Determine negotiation direction for context
        const initialPrice = parseNumericValue(negotiation.initialRequest.price);
        const targetPrice = state.targetPriceInfo.targetTotalEur;
        // Use initial price if currentPriceInfo is not set yet
        const priceToCompare = state.currentPriceInfo.price ?? initialPrice; 
        const needToNegotiateDown = shouldNegotiateDown(priceToCompare, targetPrice);
        const negotiationDirection = needToNegotiateDown ? "down" : "up";

        // Format conversation history relevant for analysis
        const historySummary = negotiation.messages.slice(-10).map(msg => { // Limit history for context window
             if (msg.sender === 'agent') return `Agent: ${msg.content}`;
             if (msg.sender === 'user') return `Customer (Us): ${msg.content}`;
             return `Carrier (${msg.sender}): ${msg.content}`;
        }).join('\\n---\\n');

        // Construct the detailed analysis prompt
        const analysisPrompt = ChatPromptTemplate.fromMessages([
            new SystemMessage(
                `You are an expert negotiation analyst assistant. Your task is to analyze the state of a freight negotiation, focusing on the latest message from the carrier (if any), and determine key information including the current operative price and whether the human user needs to review the situation.

                Negotiation Context:
                - Route: ${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}
                - Our Target Price: ${state.targetPriceInfo.targetTotalStr}
                - Initial Offer Price: ${negotiation.initialRequest.price}
                - We need to negotiate the price ${negotiationDirection}.
                - Agent Style: ${config.style}
                - Agent Max Replies Rule: ${config.maxAutoReplies} (Current count: ${negotiation.agentReplyCount || 0})
                - Agent Notify on New Terms Rule: ${config.notifyOnNewTerms}
                - Agent Notify on Price Change Rule: ${config.notifyOnPriceChange} (i.e., when price is different from last offer)
                - Agent Notify on Target Price Reached Rule: ${config.notifyOnTargetPriceReached}
                - Agent Notify on Agreement Rule: ${config.notifyOnAgreement}
                - Agent Notify on Confusion Rule: ${config.notifyOnConfusion}
                - Agent Notify on Refusal Rule: ${config.notifyOnRefusal}

                Conversation History (Last 10 messages):
                ${historySummary}
                ---
                Latest message from Carrier (if any): ${latestMessage ? `"${latestMessage.content}"` : "None"}
                ---
                `
            ),
            new HumanMessage(
                `Analyze the current negotiation state based *primarily* on the conversation history and the latest carrier message (if one exists). If there's no latest message from the carrier, analyze based on the history and determine if the agent should initiate.

                Agent Configuration Context (relevant bypass flags):
                - bypassNewTermsCheck: ${config.bypassNewTermsCheck || false}
                - bypassPriceChangeCheck: ${config.bypassPriceChangeCheck || false}
                - bypassMaxRepliesCheck: ${config.bypassMaxRepliesCheck || false}
                - bypassTargetPriceCheck: ${config.bypassTargetPriceCheck || false}
                - bypassAgreementCheck: ${config.bypassAgreementCheck || false}
                - bypassConfusionCheck: ${config.bypassConfusionCheck || false}
                - bypassRefusalCheck: ${config.bypassRefusalCheck || false}

                Provide your analysis ONLY as a JSON object with the following fields:

                1.  "intent": The carrier's apparent intent in their *latest* message ('agreement', 'refusal', 'counter_proposal', 'question', 'new_terms', 'other', 'none' if no message). Interpret simple "yes", "ok" etc. as 'agreement' if context suggests confirmation.
                2.  "explicitPriceInMessage": Any specific total price (EUR number only) explicitly mentioned in the *latest* carrier message (null if none).
                3.  "currentNegotiationPrice": The *current operative price* (EUR number only) of the negotiation after considering the latest message and history. This is the price currently "on the table". If the carrier agreed to our last offer, use that price. If they made a counter-offer, use that. If they refused without a counter, the previous price might still stand or be unclear (use null). If no price established yet, use the initial price.
                4.  "newTermsDetected": Boolean indicating if the *latest* carrier message introduced new conditions (delivery times, payment terms, etc.).
                5.  "needsReview": Boolean indicating if the human user *must* review this negotiation *before* the agent replies. Set to true if:
                    a) The negotiation goal (target price) seems to have been met or exceeded based on the "currentNegotiationPrice" AND the 'notifyOnTargetPriceReached' setting is true AND the 'bypassTargetPriceCheck' flag is false.
                    b) The carrier explicitly agreed ("intent" is 'agreement') to a price AND the 'notifyOnAgreement' setting is true AND the 'bypassAgreementCheck' flag is false.
                    c) "newTermsDetected" is true AND the 'notifyOnNewTerms' rule is enabled AND the 'bypassNewTermsCheck' flag (see context above) is false.
                    d) The carrier's latest response proposes a different price than what was previously discussed AND the 'notifyOnPriceChange' rule is enabled AND the 'bypassPriceChangeCheck' flag is false.
                    e) The agent reply count (${negotiation.agentReplyCount || 0}) has reached or exceeded the 'maxAutoReplies' rule (${config.maxAutoReplies}) AND the 'bypassMaxRepliesCheck' flag is false.
                    f) The conversation seems stalled, confused, or requires strategic input only a human can provide AND the 'notifyOnConfusion' setting is true AND the 'bypassConfusionCheck' flag is false.
                    g) The carrier's intent is 'refusal' and it seems final AND the 'notifyOnRefusal' setting is true AND the 'bypassRefusalCheck' flag is false.
                    h) There's no latest message from the carrier, but it's the agent's turn to start the negotiation (no messages or last message was ours). In this initial case, review is NOT needed unless rules trigger.
                6.  "reviewReason": A concise explanation (string, max 15 words) ONLY if "needsReview" is true. Example: "Target price met.", "Carrier agreed to price.", "New terms require review.", "Max replies reached.", "Proposed price has changed."

                Example Output:
                {
                  "intent": "counter_proposal",
                  "explicitPriceInMessage": 820,
                  "currentNegotiationPrice": 820,
                  "newTermsDetected": false,
                  "needsReview": false,
                  "reviewReason": null
                }`
            )
        ]);

        // Create the chain with output parsing
        const analysisChain = analysisPrompt.pipe(model).pipe(
            new JsonOutputParser<{
                intent: 'agreement' | 'refusal' | 'counter_proposal' | 'question' | 'new_terms' | 'other' | 'none' | 'error';
                explicitPriceInMessage: number | null;
                currentNegotiationPrice: number | null;
                newTermsDetected: boolean;
                needsReview: boolean;
                reviewReason: string | null;
            }>()
        );

        // Execute the chain
        const analysis = await analysisChain.invoke({});
        console.log(`[LangGraph] LLM Analysis result:`, analysis);

        // --- Validate LLM Output ---
        if (!analysis || typeof analysis.intent !== 'string' || typeof analysis.needsReview !== 'boolean') {
             console.error("[LangGraph] Invalid analysis structure received from LLM:", analysis);
             // Attempt to recover or default
             return {
                 analysisResult: { // Use the new, simplified structure
                     intent: 'error',
                     priceInMessage: null,
                     newTermsDetected: false,
                     summary: "Error: Invalid analysis structure from LLM."
                 },
                 currentPriceInfo: { // Update price info based on LLM, even if partial
                     price: analysis?.currentNegotiationPrice ?? state.currentPriceInfo.price, // Use LLM price if available
                     priceStr: analysis?.currentNegotiationPrice ? `${analysis.currentNegotiationPrice.toFixed(2)} EUR` : state.currentPriceInfo.priceStr,
                     source: 'llm_analysis', // New source type
                     timestamp: Date.now()
                 },
                 finalAction: 'error', // Force error state
                 errorDetails: "Invalid analysis structure received from LLM.",
                 reviewReason: "LLM analysis failed." // Provide a reason for error
             };
        }

        // --- Update State based on LLM Analysis ---
        
        // Determine final action based on LLM's review decision
        const finalAction = analysis.needsReview ? 'review' : null; // Null means continue to generate response

        // Construct the updated state parts
        const updatedAnalysisResult = {
            intent: analysis.intent,
            priceInMessage: analysis.explicitPriceInMessage, 
            newTermsDetected: analysis.newTermsDetected,
            summary: analysis.needsReview ? (analysis.reviewReason ?? undefined) : `LLM analyzed: Intent=${analysis.intent}, Price=${analysis.currentNegotiationPrice ?? 'N/A'}`
        };

        // --- Revert to using LLM analyzed price directly ---
        const updatedPriceInfo = {
            price: analysis.currentNegotiationPrice, // Use LLM's price
            priceStr: analysis.currentNegotiationPrice ? `${analysis.currentNegotiationPrice.toFixed(2)} EUR` : null,
            source: 'llm_analysis' as const, // Mark as from LLM
            timestamp: Date.now()
        };
        // --------------------------------------------------

        return {
            analysisResult: updatedAnalysisResult,
            currentPriceInfo: updatedPriceInfo,
            finalAction: finalAction, // Let the graph decide based on this
            reviewReason: analysis.reviewReason // Pass reason along
        };

    } catch (error) {
        console.error(`[LangGraph] Error in LLM message analysis:`, error);
        return {
            analysisResult: { // Use the new, simplified structure for error state
                intent: 'error',
                priceInMessage: null,
                newTermsDetected: false,
                summary: (error instanceof Error ? error.message : 'Unknown analysis error') || undefined, // Ensure summary is string | undefined
            },
             currentPriceInfo: { // Keep existing price info on error
                 ...state.currentPriceInfo,
                 source: 'error', // Mark price source as error state
                 timestamp: Date.now()
             },
            finalAction: 'error',
            errorDetails: `Error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
            reviewReason: "Agent encountered an analysis error."
        };
    }
}

// 3. generateResponse - Generate a response message
export async function generateResponse(state: NegotiationAgentState): Promise<Partial<NegotiationAgentState>> {
    console.log(`[LangGraph] Generating response for negotiation: ${state.negotiationId}`);
    
    if (!state.negotiationDoc || !state.agentConfig) {
        return {
            finalAction: 'error',
            errorDetails: 'Missing negotiation document or agent configuration.'
        };
    }
    
    try {
        // Create OpenAI client
        const model = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.3 // Slight randomness for more natural responses
        });
        
        const negotiation = state.negotiationDoc;
        const config = state.agentConfig;
        
        // Format the conversation history for the LLM
        const conversationHistory: BaseMessage[] = negotiation.messages.map(msg => {
            if (msg.sender === 'agent') {
                return new AIMessage(msg.content);
            } else if (msg.sender === 'user') {
                return new HumanMessage(`[Customer message]: ${msg.content}`);
            } else if (msg.sender === 'system') {
                return new SystemMessage(msg.content);
            } else {
                // Email or other sender (counterparty)
                return new HumanMessage(`[${msg.sender}]: ${msg.content}`);
            }
        });
        
        // Determine the negotiation style
        let styleGuidance = "";
        if (config.style === "conservative") {
            styleGuidance = "You're the friendly type. Build relationships, focus on long-term business, and be patient with negotiations. Still protect your interests, but in a cooperative way.";
        } else if (config.style === "balanced") {
            styleGuidance = "You're straightforward but fair. Get to the point quickly about price, but remain professional and build rapport when appropriate.";
        } else if (config.style === "aggressive") {
            styleGuidance = "You're a tough negotiator. Be direct, push harder for your price target, and don't waste time. Use pressure tactics like mentioning other options or deadlines.";
        }
        
        // Determine negotiation direction based on price comparison (using the LLM-determined current price)
        const currentPrice = state.currentPriceInfo.price;
        const targetPrice = state.targetPriceInfo.targetTotalEur;
        const needToNegotiateDown = shouldNegotiateDown(currentPrice, targetPrice);
        
        // Always communicate as the customer regardless of negotiation direction
        const rolePerspective = "customer";
        
        // Check if this is the first agent message
        const isFirstMessage = negotiation.messages.filter((m: any) => m.sender === 'agent').length === 0;
        
        // Adjust tactics and opening based on negotiation direction
        let initialTactic = "";
        let firstMessageOpening = "";
        
        if (isFirstMessage) {
            if (needToNegotiateDown) {
                firstMessageOpening = "Start by greeting them briefly, mention you saw their offer for the route, and immediately suggest a lower price than your actual target. Create an anchor point.";
                initialTactic = `Start with a price LOWER than your target of ${targetPrice?.toFixed(2)} EUR - this gives you room to negotiate upward.`;
            } else {
                firstMessageOpening = "Start by greeting them briefly, mention you saw their offer for the route, and immediately suggest a higher price than your actual target. Create an anchor point.";
                initialTactic = `Start with a price HIGHER than your target of ${targetPrice?.toFixed(2)} EUR - this gives you room to negotiate downward.`;
            }
        }
        
        // Format the target price as a string for use in prompts
        const targetPriceStr = targetPrice ? `${targetPrice.toFixed(2)} EUR` : "unknown";
        const currentPriceStr = state.currentPriceInfo.priceStr || "unknown"; // Use priceStr from state
        
        // Construct the system prompt
        const systemPrompt = `
YOU ARE: A logistics/freight professional who uses transport exchanges like TIMOCOM/Trans.eu daily. You've spotted an offer and are messaging the carrier.

YOUR GOAL: Negotiate the TOTAL PRICE ${needToNegotiateDown ? "DOWN" : "UP"} to ${targetPriceStr} for transport from ${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}.

LOAD DETAILS: ${negotiation.initialRequest.loadType || 'Standard load'}, ${negotiation.initialRequest.weight || 'N/A'}.

CURRENT SITUATION:
- The current price on the table is ${currentPriceStr}
- Your target price is ${targetPriceStr}
- You need to ${needToNegotiateDown ? "LOWER" : "RAISE"} this price

YOUR PERSONALITY: ${styleGuidance}

${firstMessageOpening}
${initialTactic}

COMMUNICATION STYLE:
1. QUICK & CASUAL - Transport professionals are busy and write short, direct messages
2. PRACTICAL - Focus on price, times, and essential details only
3. PERSONAL VOICE - Use "I" (not "we") and never mention your company name 
4. TOTAL PRICE ONLY - Only discuss the absolute total price (${targetPriceStr}), NEVER mention price per kilometer
5. AUTHENTIC - NEVER use placeholders like [Your Name] or [Company Name]
6. DIRECT - Skip formal greetings and closings, get straight to the point

NEGOTIATION TACTICS:
- ANCHORING: Start with a price that gives room to negotiate
- GRADUAL CONCESSIONS: Move toward your target price slowly, in small increments
- FUTURE BUSINESS: Mention potential for regular loads or future cooperation when appropriate
- COMPETITION: Occasionally mention you're looking at other options (if negotiations stall)
- TIME PRESSURE: Suggest needing a quick decision when appropriate

TECHNICAL REQUIREMENT: Your message will be placed in a JSON object. Only write the message content, nothing else.
`;

        // Define a response format instructions prompt
        const responseFormatPrompt = `
Current negotiation status:
- Last message from carrier: "${state.latestMessage?.content || 'No message yet'}"
- Their intent appears to be: ${state.analysisResult.intent}
- Brief summary: ${state.analysisResult.summary}
- Current offer on the table: ${currentPriceStr}
- Your target: ${targetPriceStr}

TACTICAL ADVICE FOR THIS RESPONSE:
${isFirstMessage ? 
  `- This is your FIRST contact - be direct, mention seeing their offer and propose a price without any formal letter structure` :
  `- This is a follow-up message - stay focused on price negotiation`
}

${state.analysisResult.intent === 'refusal' ? 
  `- They've refused your offer - stand firm but be professional, maybe offer a small concession or mention future business potential` : 
  state.analysisResult.intent === 'counter_proposal' ?
  `- They've countered - if far from target, counter again with minimal movement; if close to target, consider accepting or final small counter` :
  state.analysisResult.intent === 'question' ?
  `- They have questions - answer briefly then refocus on price negotiation` :
  `- Stay focused on your price target of ${targetPriceStr}`
}

${Math.abs((currentPrice || 0) - (targetPrice || 0)) < (targetPrice || 0) * 0.05 ?
  `- You're VERY CLOSE to your target price - consider agreeing or making one final small adjustment` :
  `- You're still ${needToNegotiateDown ? "above" : "below"} your target price - continue negotiating`
}

IMPORTANT STYLE NOTES:
- Use singular "I" not plural "we"
- No signature blocks, company names, or formal closings
- No placeholders like [Your Name]
- Just write a simple, direct message as a real person would in a chat

Write ONLY the message content as a freight professional would - short, direct, and focused on the deal.
`;

        // Create the prompt template
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ...conversationHistory,
            ["human", responseFormatPrompt]
        ]);
        
        // Create and execute the chain
        const responseChain = promptTemplate.pipe(model);
        const response = await responseChain.invoke({});
        
        // Extract just the content
        const responseText = response.content.toString();
        
        console.log(`[LangGraph] Generated response: ${responseText}`);
        
        return {
            generatedMessage: responseText,
            finalAction: state.finalAction || 'send' // Default to send if no other action has been determined
        };
        
    } catch (error) {
        console.error(`[LangGraph] Error generating response:`, error);
        
        return {
            finalAction: 'error',
            errorDetails: `Error generating response: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// Create simplified wrapper functions for final nodes
export async function finalSend(state: NegotiationAgentState): Promise<Partial<NegotiationAgentState>> {
    return { finalAction: 'send' };
}

export async function finalReview(state: NegotiationAgentState): Promise<Partial<NegotiationAgentState>> {
    return { finalAction: 'review' };
}

export async function finalError(state: NegotiationAgentState): Promise<Partial<NegotiationAgentState>> {
    return { finalAction: 'error' };
}

// Create the LangGraph state graph - simplified to avoid complex typing issues
export function createNegotiationAgentGraph() {
    // This is a simplified executor function that handles the state transitions
    async function executeGraph(initialState: NegotiationAgentState): Promise<NegotiationAgentState> {
        // Start with the initial state
        let state = { ...initialState };
        
        try {
            // Step 1: Start the agent
            console.log(`[Agent] Starting agent for negotiation: ${state.negotiationId}`);
            const startResult = await startAgent(state);
            state = { ...state, ...startResult };
            
            // Check for early exit (error)
            if (state.finalAction === 'error') {
                console.log(`[Agent] Error in start phase: ${state.errorDetails}`);
                return state;
            }
            
            // Step 2: Analyze state & latest message (this node now decides if review is needed)
            console.log(`[Agent] Analyzing state & latest message`);
            const analysisResult = await analyzeLatestMessage(state);
            state = { ...state, ...analysisResult };
            
            // Check if LLM analysis resulted in an error or needs review
            if (state.finalAction === 'error') {
                console.log(`[Agent] Error during analysis: ${state.errorDetails}`);
                return state;
            } 
            if (state.finalAction === 'review') {
                console.log(`[Agent] Analysis flagged for review: ${state.reviewReason}`);
                return state; // Exit early for review
            }
            
            // Step 3: Generate response (only if no review needed)
            console.log(`[Agent] Generating response`);
            const responseResult = await generateResponse(state);
            state = { ...state, ...responseResult };
            
            // Return the final state (finalAction should be 'send' or 'error' here)
            return state;
            
        } catch (error) {
            console.error(`[Agent] Error in graph execution:`, error);
            return {
                ...state,
                finalAction: 'error',
                errorDetails: `Error executing agent: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    
    // Return the executor function
    return executeGraph;
}

// Create an agent executor function
export async function executeNegotiationAgent(initialState: NegotiationAgentState) {
    try {
        console.log(`[LangGraph] Executing negotiation agent for ${initialState.negotiationId}`);
        
        // Create the graph executor
        const executor = createNegotiationAgentGraph();
        
        // Run the executor with initial state
        const result = await executor(initialState);
        
        console.log(`[LangGraph] Agent execution completed with action: ${result.finalAction}`);
        
        return result;
    } catch (error) {
        console.error(`[LangGraph] Error executing negotiation agent:`, error);
        
        // Return error state
        return {
            ...initialState,
            finalAction: 'error',
            errorDetails: `Error executing negotiation agent: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}