import { internalAction, ActionCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get environment variables or throw
function getEnvVariable(varName: string): string {
    const value = process.env[varName];
    if (value === undefined) {
        throw new Error(`Required environment variable "${varName}" is not set. Ensure it's configured in your Convex dashboard environment variables.`);
    }
    return value;
}

// OpenAI API endpoint
const OPENAI_CHAT_COMPLETION_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Internal action to interact with the OpenAI API using the Chat Completions endpoint.
 */
export const generateChatCompletion = internalAction({
    args: {
        messages: v.array(v.object({ // Expect an array of message objects
            role: v.string(), // 'system', 'user', or 'assistant'
            content: v.string()
        })),
        // Optional: Add other OpenAI parameters like max_tokens, temperature later
        // max_tokens: v.optional(v.number()),
        // temperature: v.optional(v.number()),
    },
    handler: async (ctx: ActionCtx, args): Promise<string> => {
        console.log(`[OpenAI Chat Action] Received ${args.messages.length} messages.`);
        const apiKey = getEnvVariable("OPENAI_API_KEY");

        console.log(`[OpenAI Chat Action] Calling OpenAI API...`);
        try {
            const response = await fetch(OPENAI_CHAT_COMPLETION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", 
                    messages: args.messages, // Pass the structured messages array directly
                    response_format: { type: "json_object" }, 
                    // Add other parameters as needed 
                    // temperature: 0.7,
                    // max_tokens: 250, 
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;
            if (!content) {
                console.error("[OpenAI Chat Action] Unexpected response structure:", result);
                throw new Error("OpenAI response did not contain expected content.");
            }

            console.log(`[OpenAI Chat Action] Successfully received response from OpenAI.`);
            return content; // Should be the JSON string 

        } catch (error: any) {
            console.error("[OpenAI Chat Action] Error calling OpenAI:", error);
            return JSON.stringify({
                action: "error",
                reason: `Failed to call OpenAI: ${error.message}`
            });
        }
    },
}); 