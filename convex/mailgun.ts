"use node";
import crypto from "crypto";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper function to get environment variables or throw
function getEnvVariable(varName: string): string {
    const value = process.env[varName];
    if (value === undefined) {
        throw new Error(`Required environment variable "${varName}" is not set. Ensure it's configured in your Convex dashboard environment variables.`);
    }
    return value;
}

interface VerificationResult {
    success: boolean;
    status: number;
    message: string;
}

/**
 * Verifies the signature of an incoming Mailgun webhook request.
 */
function verifyMailgunSignature(timestamp: string, token: string, signature: string): VerificationResult {
    const signingKey = getEnvVariable("MAILGUN_SIGNING_KEY");

    // Check if timestamp is recent (e.g., within 5 minutes)
    // Convert timestamp string to number for comparison
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
        return { success: false, status: 400, message: "Invalid timestamp format" };
    }
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (5 * 60); // Use seconds since epoch
    if (timestampNum < fiveMinutesAgo) {
        console.warn("Mailgun webhook timestamp is too old:", timestamp);
        // In production, you might want to reject old timestamps uncommenting the line below
        // return { success: false, status: 400, message: "Webhook timestamp too old" };
    }

    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp + token) // Concatenate timestamp string and token
        .digest('hex');

    // Use timing-safe comparison
    try {
        const expectedSignatureBuffer = Buffer.from(encodedToken);
        const providedSignatureBuffer = Buffer.from(signature);

        if (expectedSignatureBuffer.length !== providedSignatureBuffer.length ||
            !crypto.timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)) {
            console.error("Mailgun webhook signature verification failed.");
            return { success: false, status: 401, message: "Webhook signature verification failed" };
        }
    } catch (error) {
        console.error("Error during timingSafeEqual comparison:", error);
        return { success: false, status: 500, message: "Error during signature comparison" };
    }


    console.log("Mailgun webhook signature verified successfully.");
    return { success: true, status: 200, message: "Signature verified" };
}


/**
 * Internal action to verify Mailgun webhook and process the email reply.
 */
export const verifyAndProcessWebhook = internalAction({
    args: {
        // Signature components
        timestamp: v.string(),
        token: v.string(),
        signature: v.string(),
        // Email data
        recipient: v.string(),
        sender: v.string(),
        bodyPlain: v.string(),
        messageId: v.string(),
    },
    handler: async (ctx, args): Promise<VerificationResult> => {
        // 1. Verify Signature
        const verification = verifyMailgunSignature(args.timestamp, args.token, args.signature);
        if (!verification.success) {
            return verification; // Return failure details
        }

        // 2. Parse Negotiation ID
        const recipientMatch = args.recipient.match(/^reply\+([^@]+)@/);
        if (!recipientMatch || !recipientMatch[1]) {
            console.error("Could not parse negotiation ID from recipient:", args.recipient);
            // Return 200 OK to Mailgun to prevent retries for unparseable addresses,
            // but indicate logical failure in the message for internal tracking.
            return { success: false, status: 200, message: "Could not parse negotiation ID" };
        }
        const negotiationIdString = recipientMatch[1];
        const negotiationId = negotiationIdString as Id<"negotiations">;

        // 3. Add Message via Mutation
        try {
            await ctx.runMutation(internal.negotiations.addReplyFromEmail, {
                negotiationId: negotiationId,
                senderEmail: args.sender,
                content: args.bodyPlain,
                incomingMessageId: args.messageId,
            });
            console.log(`Successfully processed email reply for negotiation ${negotiationIdString}`);
            return { success: true, status: 200, message: "Webhook processed successfully" };
        } catch (error: any) {
            console.error(`Error running addReplyFromEmail mutation for negotiation ${negotiationIdString}:`, error);
            // Return 500 as it's an internal processing error
            return { success: false, status: 500, message: "Internal Server Error processing message" };
        }
    },
}); 