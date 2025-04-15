import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper function to get user or throw error if not authenticated
// Includes retry logic for authentication to handle race conditions
async function getUserOrThrow(ctx: QueryCtx | MutationCtx, retries = 2, delayMs = 150) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        if (attempt < retries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw new Error("User not authenticated.");
      }
      
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
        
      if (!user) {
        if (attempt < retries) {
          // Wait longer before retrying if we found identity but not user
          await new Promise(resolve => setTimeout(resolve, delayMs * 2));
          continue;
        }
        throw new Error("User not found in database.");
      }
      
      return user;
    } catch (error) {
      if (attempt < retries) {
        // Wait before retrying on other errors
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  
  // This line should be unreachable due to the final throw in the loop
  throw new Error("Failed to authenticate user after retries.");
}

/**
 * List all active connections for the current user.
 */
export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getUserOrThrow(ctx);
      const connections = await ctx.db
        .query("connections")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .order("desc") // Optional: Show most recent first
        .collect();
      return connections;
    } catch (error: any) {
      console.error("Error fetching connections:", error.message);
      // Depending on requirements, either return empty array or re-throw
      return []; 
    }
  },
});

/**
 * Delete a specific connection.
 */
export const deleteConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    try {
      const user = await getUserOrThrow(ctx);
      
      // Optional: Verify the connection belongs to the user before deleting
      const connection = await ctx.db.get(args.connectionId);
      if (!connection) {
        throw new Error("Connection not found.");
      }
      if (connection.userId !== user._id) {
        throw new Error("User not authorized to delete this connection.");
      }
      
      await ctx.db.delete(args.connectionId);
      console.log(`Connection ${args.connectionId} deleted successfully for user ${user._id}.`);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting connection:", error);
      // Return a failure status or throw the error based on frontend needs
      return { success: false, error: error.message }; 
    }
  },
});

/**
 * Internal mutation to store or update a Google connection.
 * Called by the handleGoogleCallback HTTP action.
 */
export const storeOrUpdateGoogleConnection = internalMutation({
  args: {
    userId: v.id("users"),
    accountEmail: v.string(),
    scopes: v.array(v.string()),
    // --- UNSAFE - FOR DEVELOPMENT ONLY --- 
    accessToken: v.optional(v.string()), 
    refreshToken: v.optional(v.string()), 
    // -------------------------------------
  },
  handler: async (ctx, args) => {
    const existingConnection = await ctx.db
      .query("connections")
      .withIndex("by_userId_provider", q => 
        q.eq("userId", args.userId).eq("provider", "google")
      )
      .first();

    const updateData: Partial<Doc<"connections">> = {
      accountEmail: args.accountEmail,
      scope: args.scopes.join(' '),
      accessToken: args.accessToken,
      // Only include refreshToken if it's provided 
      ...(args.refreshToken !== undefined && { refreshToken: args.refreshToken }),
    };

    if (existingConnection) {
      // Update existing connection
      await ctx.db.patch(existingConnection._id, updateData);
      console.log(`Google connection updated for user ${args.userId} (Tokens stored UNSAFELY)`);
      return { connectionId: existingConnection._id };
    } else {
      // Create new connection - Ensure all required fields are explicitly provided
      const connectionId = await ctx.db.insert("connections", {
        userId: args.userId,
        provider: "google", // Explicitly set provider
        accountEmail: args.accountEmail, // Required
        scope: args.scopes.join(' '),
        accessToken: args.accessToken, // Optional field from args
        refreshToken: args.refreshToken, // Optional field from args (will be undefined if not sent)
      });
      console.log(`New Google connection created for user ${args.userId} (Tokens stored UNSAFELY)`);
      return { connectionId };
    }
  },
});

/**
 * Mutation to generate a unique state parameter for OAuth flow
 * and store it temporarily with the user ID.
 */
export const generateOAuthState = mutation({
    args: {},
    handler: async (ctx: MutationCtx) => {
        const user = await getUserOrThrow(ctx);
        // Generate a secure random string for the state
        // Using simple timestamp + random for illustration, consider crypto.randomUUID() in Node env
        const stateValue = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

        await ctx.db.insert("oauthStates", {
            userId: user._id,
            stateValue: stateValue,
        });

        console.log(`Generated OAuth state for user ${user._id}: ${stateValue}`);
        return stateValue; // Return the state value to the caller
    },
});

/**
 * Internal mutation to consume (validate and delete) an OAuth state value.
 * Returns the associated user ID if valid, otherwise throws an error.
 */
export const consumeOAuthState = internalMutation({
    args: { stateValue: v.string() },
    handler: async (ctx, args) => {
        const stateRecord = await ctx.db
            .query("oauthStates")
            .withIndex("by_stateValue", (q) => q.eq("stateValue", args.stateValue))
            .unique();

        if (!stateRecord) {
            console.error(`Invalid or expired OAuth state received: ${args.stateValue}`);
            throw new Error("Invalid or expired OAuth state provided.");
        }

        // State is valid, delete it (single-use)
        await ctx.db.delete(stateRecord._id);
        console.log(`Consumed OAuth state ${args.stateValue} for user ${stateRecord.userId}`);
        return stateRecord.userId; // Return the linked user ID
    },
});

// NOTE: Mutations/Actions for CREATING connections (OAuth handling)
// are intentionally omitted here. They require backend logic (HTTP Actions)
// to handle OAuth redirects, code exchange, and secure token storage. 