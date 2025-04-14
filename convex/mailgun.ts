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
 * Verifies a Mailgun webhook using their standard verification method
 * https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
 */
function verifyMailgunWebhook(formData: Record<string, string>): VerificationResult {
    console.log("[MAILGUN VERIFY] Starting webhook verification");
    
    // Mailgun's verification requires these form fields
    const timestamp = formData["timestamp"];
    const token = formData["token"];
    const signature = formData["signature"];
    
    console.log("[MAILGUN VERIFY] Extracted verification fields:", {
        timestamp: timestamp || "MISSING",
        token: token || "MISSING", 
        signature: signature || "MISSING"
    });
    
    if (!timestamp || !token || !signature) {
        console.warn("[MAILGUN VERIFY] Missing verification fields in form data");
        return { 
            success: false, 
            status: 400, 
            message: "Missing required verification fields" 
        };
    }
    
    try {
        const signingKey = getEnvVariable("MAILGUN_SIGNING_KEY");
        console.log("[MAILGUN VERIFY] Using signing key (first 4 chars):", signingKey.substring(0, 4) + "...");
        
        // Check if timestamp is recent (within 5 minutes)
        const timestampNum = parseInt(timestamp, 10);
        if (isNaN(timestampNum)) {
            return { success: false, status: 400, message: "Invalid timestamp format" };
        }
        
        const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (5 * 60);
        if (timestampNum < fiveMinutesAgo) {
            console.warn("[MAILGUN VERIFY] Webhook timestamp is too old:", timestamp);
            // Uncomment in production if you want to enforce timestamp freshness
            // return { success: false, status: 400, message: "Webhook timestamp too old" };
        }
        
        // Calculate expected signature using HMAC
        const encodedToken = crypto
            .createHmac('sha256', signingKey)
            .update(timestamp + token)
            .digest('hex');
        
        console.log("[MAILGUN VERIFY] Calculated signature:", encodedToken);
        console.log("[MAILGUN VERIFY] Provided signature:", signature);
        
        // Compare signatures
        if (encodedToken !== signature) {
            console.error("[MAILGUN VERIFY] Signature verification failed");
            return { 
                success: false, 
                status: 401, 
                message: "Invalid signature" 
            };
        }
        
        console.log("[MAILGUN VERIFY] Webhook signature verified successfully");
        return { 
            success: true, 
            status: 200, 
            message: "Signature verified" 
        };
    } catch (error: any) {
        console.error("[MAILGUN VERIFY] Error during verification:", error);
        return { 
            success: false, 
            status: 500, 
            message: `Verification error: ${error.message}` 
        };
    }
}

/**
 * Internal action to process and verify Mailgun webhooks
 */
export const verifyAndProcessWebhook = internalAction({
    args: {
        formData: v.any(),
    },
    handler: async (ctx, args): Promise<VerificationResult> => {
        const formData = args.formData as Record<string, string>;
        console.log("[MAILGUN ACTION] Processing webhook with form data keys:", Object.keys(formData));
        
        // 1. Verify Mailgun webhook authenticity
        const verification = verifyMailgunWebhook(formData);
        if (!verification.success) {
            return verification;
        }
        
        // 2. Extract email data
        const recipient = formData.recipient;
        const sender = formData.sender;
        const bodyPlain = formData["stripped-text"] || formData["body-plain"] || "";
        const messageId = formData["Message-Id"] || "";
        const subject = formData.subject || "";
        
        console.log("[MAILGUN ACTION] Extracted email fields:", {
            recipient,
            sender,
            subject,
            bodyLength: bodyPlain.length,
            messageId
        });
        
        // 3. Parse negotiation ID from recipient
        console.log("[MAILGUN ACTION] Parsing negotiationId from recipient:", recipient);
        // Trying multiple patterns for maximum compatibility
        let negotiationId: string | null = null;
        
        // Pattern 1: standard format reply+ID@domain
        const pattern1 = recipient.match(/^reply\+([^@]+)@/);
        if (pattern1 && pattern1[1]) {
            negotiationId = pattern1[1];
            console.log("[MAILGUN ACTION] Found negotiationId using pattern 1:", negotiationId);
        } 
        // Pattern 2: reply@domain (ID might be in another field)
        else if (recipient.match(/^reply@/) && subject.includes("Negotiation")) {
            // Try to extract from subject line like "Re: Update on Negotiation #abc123"
            const subjectMatch = subject.match(/Negotiation\s+#?([a-zA-Z0-9]+)/);
            if (subjectMatch && subjectMatch[1]) {
                negotiationId = subjectMatch[1];
                console.log("[MAILGUN ACTION] Found negotiationId from subject:", negotiationId);
            }
        }
        // Pattern 3: just try to find any ID-like string in the recipient
        else {
            const pattern3 = recipient.match(/[a-zA-Z0-9]{10,}/);
            if (pattern3) {
                negotiationId = pattern3[0];
                console.log("[MAILGUN ACTION] Found possible negotiationId using fallback pattern:", negotiationId);
            }
        }
        
        if (!negotiationId) {
            console.error("[MAILGUN ACTION] Failed to extract negotiationId from:", recipient);
            return { 
                success: false, 
                status: 200, // Return 200 to avoid retries
                message: "Could not determine negotiation ID" 
            };
        }
        
        // 4. Add the message to the negotiation
        try {
            // Attempt to convert string ID to a Convex ID
            const convexId = negotiationId as Id<"negotiations">;
            
            // Call the mutation to add the reply
            await ctx.runMutation(internal.negotiations.addReplyFromEmail, {
                negotiationId: convexId,
                senderEmail: sender,
                content: bodyPlain,
                incomingMessageId: messageId,
            });
            
            console.log(`[MAILGUN ACTION] Successfully processed email reply for negotiation ${negotiationId}`);
            return { 
                success: true, 
                status: 200, 
                message: "Email reply processed successfully" 
            };
        } catch (error: any) {
            console.error(`[MAILGUN ACTION] Error processing reply for negotiation ${negotiationId}:`, error);
            return { 
                success: false, 
                status: 200, // Still return 200 to prevent retries
                message: `Error processing: ${error.message}` 
            };
        }
    },
}); 