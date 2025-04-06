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
 * Internal action to interact with the OpenAI API for chat completions.
 * Note: Using 'internalAction' ensures API keys and sensitive logic
 * are kept on the server-side and not exposed to the client.
 */
export const generateCompletion = internalAction({
    args: {
        prompt: v.string(),
        // Optional: Add other OpenAI parameters like max_tokens, temperature later
        // max_tokens: v.optional(v.number()),
        // temperature: v.optional(v.number()),
    },
    handler: async (ctx: ActionCtx, args): Promise<string> => {
        console.log(`[OpenAI Action] Received prompt.`);
        const apiKey = getEnvVariable("OPENAI_API_KEY");

        console.log(`[OpenAI Action] Calling OpenAI API...`);
        try {
            const response = await fetch(OPENAI_CHAT_COMPLETION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo", // Or specify another model like gpt-4
                    messages: [
                        // Optional: Add a system message if needed for context/role setting
                        // { role: "system", content: "You are a helpful assistant." }, 
                        { role: "user", content: args.prompt },
                    ],
                    // Ensure response is JSON parsable
                    response_format: { type: "json_object" }, 
                    // Add other parameters as needed (temperature, max_tokens)
                    // temperature: 0.7,
                    // max_tokens: 150,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
            }

            const result = await response.json();

            // Extract the content from the first choice's message
            const content = result.choices?.[0]?.message?.content;
            if (!content) {
                console.error("[OpenAI Action] Unexpected response structure:", result);
                throw new Error("OpenAI response did not contain expected content.");
            }

            console.log(`[OpenAI Action] Successfully received response from OpenAI.`);
            return content; // Should be the JSON string we asked for

        } catch (error: any) {
            console.error("[OpenAI Action] Error calling OpenAI:", error);
            // Return an error JSON structure that the agent can handle
            return JSON.stringify({
                action: "error",
                reason: `Failed to call OpenAI: ${error.message}`
            });
        }
    },
}); 