import { action, internalAction, internalQuery, ActionCtx, QueryCtx, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";

// Helper function to get environment variables or throw
function getEnvVariable(varName: string): string {
    const value = process.env[varName];
    if (value === undefined) {
        throw new Error(`Required environment variable "${varName}" is not set.`);
    }
    return value;
}

// --- Helper Query to Get Connection Details ---
export const getConnectionInternal = internalQuery({
    args: { userId: v.id("users"), provider: v.string() },
    handler: async (ctx: QueryCtx, args): Promise<Doc<"connections"> | null> => {
        const connection = await ctx.db
            .query("connections")
            .withIndex("by_userId_provider", (q: any) =>
                q.eq("userId", args.userId).eq("provider", args.provider)
            )
            .first();
        return connection; 
    },
});

// --- Action to Refresh Google Access Token ---
export const getGoogleAccessToken = internalAction({
    args: { userId: v.id("users") },
    handler: async (ctx: ActionCtx, args): Promise<string> => {
        console.log(`Getting Google access token for user ${args.userId}`);
        const connection: Doc<"connections"> | null = await ctx.runQuery(internal.email.getConnectionInternal, { 
            userId: args.userId, 
            provider: "google" 
        });
        
        if (!connection) {
            throw new Error(`Google connection not found for user ${args.userId}`);
        }
        if (!connection.refreshToken) {
            // This happens if user connected BEFORE we started saving refresh tokens,
            // or if Google didn't provide one (e.g., subsequent authorizations)
            // User might need to reconnect.
            throw new Error(`Missing Google refresh token for user ${args.userId}. Please reconnect Google account.`);
        }

        // Exchange refresh token for new access token
        const clientId = getEnvVariable("GOOGLE_CLIENT_ID");
        const clientSecret = getEnvVariable("GOOGLE_CLIENT_SECRET");
        const tokenUrl = "https://oauth2.googleapis.com/token";

        try {
            const tokenResponse: Response = await fetch(tokenUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: connection.refreshToken, // Use the stored (UNSAFE) token
                    grant_type: "refresh_token",
                }),
            });

            if (!tokenResponse.ok) {
                const errorBody = await tokenResponse.text();
                console.error(`Failed to refresh Google token for user ${args.userId}: ${tokenResponse.status} ${errorBody}`);
                throw new Error(`Failed to refresh Google token: ${tokenResponse.statusText}`);
            }

            const tokenData: any = await tokenResponse.json();
            const newAccessToken: string | undefined = tokenData.access_token;

            if (!newAccessToken) {
                console.error(`New access token missing in refresh response for user ${args.userId}`);
                throw new Error("Failed to get new access token from refresh token.");
            }
            
            console.log(`Successfully refreshed Google access token for user ${args.userId}`);
            // Optional: Update the stored access token in the DB (might require another mutation)
            // await ctx.runMutation(internal.connections.updateAccessToken, {connectionId: connection._id, accessToken: newAccessToken });
            return newAccessToken;

        } catch (error: any) {
            console.error(`Error refreshing Google token for user ${args.userId}:`, error);
            // Consider deleting the connection if refresh token is invalid?
            // await ctx.runMutation(internal.connections.deleteConnection, { connectionId: connection._id });
            throw new Error("Failed to refresh Google token. User might need to reconnect.");
        }
    },
});

// --- Action to Send Email via Gmail API ---
interface GmailSendResult {
    id: string;      // Message ID
    threadId: string;
}

export const sendGmail = internalAction({
    args: {
        accessToken: v.string(),
        to: v.string(),
        from: v.string(), 
        subject: v.string(),
        body: v.string(), 
        headers: v.optional(v.object({
          replyTo: v.optional(v.string()),      
          inReplyTo: v.optional(v.string()),    
          References: v.optional(v.string()), 
          Cc: v.optional(v.string()), // Add Cc header validation
        })),
        threadId: v.optional(v.string()),
    },
    handler: async (ctx: ActionCtx, args): Promise<{ success: boolean, messageId?: string, threadId?: string }> => {
        console.log(`Sending email from ${args.from} to ${args.to} (Thread: ${args.threadId ?? 'New'})`);
        
        let headerLines: string[] = [
            `To: ${args.to}`,
            `From: ${args.from}`,
            `Subject: ${args.subject}`,
        ];
        // Add custom headers if provided
        if (args.headers) {
            if (args.headers.replyTo) headerLines.push(`Reply-To: ${args.headers.replyTo}`);
            if (args.headers.inReplyTo) headerLines.push(`In-Reply-To: ${args.headers.inReplyTo}`); 
            if (args.headers.References) headerLines.push(`References: ${args.headers.References}`);
            if (args.headers.Cc) headerLines.push(`Cc: ${args.headers.Cc}`); // Add Cc header
        }
        // Add content type header *after* other headers
        headerLines.push(`Content-Type: text/plain; charset="UTF-8"`);

        const emailRFC822 = [
            ...headerLines,
            ``, // Blank line separates headers from body
            `${args.body}`,
        ].join("\r\n");

        // Base64 URL encoding (already fixed)
        const base64 = btoa(unescape(encodeURIComponent(emailRFC822))); 
        const base64urlEncodedEmail = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const gmailApiUrl = `https://gmail.googleapis.com/gmail/v1/users/${args.from}/messages/send`;
        
        // --- Prepare request body, including threadId if present ---
        const requestBody: { raw: string; threadId?: string } = { raw: base64urlEncodedEmail };
        if (args.threadId) {
            requestBody.threadId = args.threadId;
        }
        // ----------------------------------------------------------

        try {
            const response: Response = await fetch(gmailApiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${args.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody), // Send modified body
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Gmail API error sending email for ${args.from}: ${response.status} ${errorBody}`);
                throw new Error(`Gmail API error: ${response.statusText}`);
            }

            const result: GmailSendResult = await response.json();
            console.log(`Email sent successfully via Gmail for ${args.from}. Message ID: ${result.id}, Thread ID: ${result.threadId}`);
            // --- Return success, messageId, and threadId ---
            return { success: true, messageId: result.id, threadId: result.threadId }; 

        } catch (error: any) {
            console.error(`Error sending email via Gmail for ${args.from}:`, error);
            throw new Error("Failed to send email via Gmail.");
        }
    },
});

// --- Update Negotiation Email Sending Action ---
interface SendUpdateResult {
    success: boolean;
    reason?: string;
}

export const sendNegotiationUpdateEmail = action({
    args: {
        negotiationId: v.id("negotiations"),
        messageContent: v.string(),
        // senderUserId: v.id("users"), // No longer needed directly, derived from negotiation
    },
    handler: async (ctx: ActionCtx, args): Promise<SendUpdateResult> => {
        console.log(`Attempting to send email update for negotiation ${args.negotiationId}`);
        
        // 1. Get Negotiation Details, including the connectionId
        const negotiation: Doc<"negotiations"> | null = await ctx.runQuery(internal.negotiations.getNegotiationByIdInternal, { negotiationId: args.negotiationId });
        if (!negotiation) {
            throw new Error(`Negotiation ${args.negotiationId} not found.`);
        }
        
        // 2. Check if email is configured for this negotiation
        if (!negotiation.connectionId) {
            console.warn(`Negotiation ${args.negotiationId} has no connectionId configured. Skipping email send.`);
            return { success: false, reason: "Email connection not configured for this negotiation." };
        }
        
        const recipientEmail = negotiation.initialRequest.offerContactEmail;
        if (!recipientEmail) {
            console.warn(`Negotiation ${args.negotiationId} missing offerContactEmail. Cannot send email.`);
            return { success: false, reason: "Missing recipient email in negotiation." };
        }

        // 3. Get the specific Connection Info using negotiation.connectionId
        const senderConnection = await ctx.runQuery(internal.connections.getConnectionByIdInternal, { connectionId: negotiation.connectionId });

        if (!senderConnection) {
            console.error(`Connection ${negotiation.connectionId} not found for negotiation ${args.negotiationId}. Cannot send email.`);
            // Optionally update negotiation status to reflect error?
            return { success: false, reason: "Configured email connection not found." };
        }
        
        // Verify the connection belongs to the user who owns the negotiation (sanity check)
        if (senderConnection.userId !== negotiation.userId) {
             console.error(`Security Alert: Connection ${negotiation.connectionId} owner (${senderConnection.userId}) does not match negotiation owner (${negotiation.userId}).`);
             return { success: false, reason: "Connection owner mismatch." };
        }
        
        const senderEmail = senderConnection.email;
        const provider = senderConnection.provider;

        // 4. Get a fresh Access Token (Provider-specific)
        let accessToken: string | null = null;
        if (provider === "google") {
             // Assuming getGoogleAccessToken needs userId
             // Removed connectionId from args as it's likely not accepted by getGoogleAccessToken yet
            accessToken = await ctx.runAction(internal.email.getGoogleAccessToken, { userId: senderConnection.userId }); 
        } else if (provider === "outlook") {
            // TODO: Implement getOutlookAccessToken
             console.warn(`Outlook provider for connection ${senderConnection._id} not yet implemented.`);
             return { success: false, reason: "Outlook sending not implemented." };
        } else {
            console.error(`Unsupported provider '${provider}' for connection ${senderConnection._id}.`);
            return { success: false, reason: `Unsupported email provider: ${provider}` };
        }
        
        if (!accessToken) {
             console.error(`Failed to get access token for connection ${senderConnection._id} (Provider: ${provider}).`);
             return { success: false, reason: "Failed to refresh access token." };
        }

        // 5. Construct Email Content & Headers (Same as before)
        const subject = negotiation.emailSubject || `Update on Negotiation #${negotiation._id.substring(0, 6)}...`;
        const body = `${args.messageContent}\n\n---\nView negotiation: ${getEnvVariable("APP_URL")}/negotiations/${args.negotiationId}`;
        const replyToAddress = `reply+${negotiation._id}@replies.alterion.io`; // Assuming this is Mailgun address
        const headers: any = { replyTo: replyToAddress };
        if (negotiation.emailCcRecipients && negotiation.emailCcRecipients.length > 0) {
            headers.Cc = negotiation.emailCcRecipients.join(", ");
        }
        if (negotiation.lastEmailMessageId) {
            headers.inReplyTo = `<${negotiation.lastEmailMessageId}>`;
            headers.References = `<${negotiation.lastEmailMessageId}>`;
        }

        // 6. Send the Email (Provider-specific)
        try {
            let sendResult;
            if (provider === "google") {
                sendResult = await ctx.runAction(internal.email.sendGmail, {
                    accessToken: accessToken,
                    to: recipientEmail,
                    from: senderEmail, // Use email from the specific connection
                    subject: subject,
                    body: body,
                    headers: headers,
                    threadId: negotiation.emailThreadId,
                });
            } else if (provider === "outlook") {
                // TODO: Implement sendOutlookMail action
                throw new Error("Outlook sending not implemented.");
            }

            // 7. Store thread info if successful (Same as before)
            if (sendResult && sendResult.success && sendResult.messageId && sendResult.threadId) {
              await ctx.runMutation(internal.email.updateEmailThreadInfo, {
                negotiationId: args.negotiationId,
                threadId: sendResult.threadId,
                lastMessageId: sendResult.messageId,
              });
              console.log(`Successfully sent (${provider}) and updated thread info for negotiation ${args.negotiationId}`);
            } else if (!sendResult || !sendResult.success) {
              console.error(`Email sending action (${provider}) failed for negotiation ${args.negotiationId}`);
              return { success: false, reason: "Email sending failed internally." };
            }
            
            return { success: true };
        } catch (error: any) {
            console.error(`Failed to send negotiation email for ${args.negotiationId} (Provider: ${provider}):`, error);
            return { success: false, reason: `Email sending failed: ${error.message}` };
        }
    }
});

// --- Internal query to get connection by ID ---
// Needed because actions cannot access db directly
export const getConnectionByIdInternal = internalQuery({
    args: { connectionId: v.id("connections") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.connectionId);
    }
});

// --- Mutation to store thread info --- 
export const updateEmailThreadInfo = internalMutation({
  args: {
    negotiationId: v.id("negotiations"),
    threadId: v.string(),
    lastMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.negotiationId, {
      emailThreadId: args.threadId,
      lastEmailMessageId: args.lastMessageId,
      updatedAt: Date.now(), // Also update timestamp
    });
  }
}); 