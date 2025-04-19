import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
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
 * List NON-SENSITIVE connection details for the current user.
 */
export const listUserConnections = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getUserOrThrow(ctx);
      const connections = await ctx.db
        .query("connections")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .order("desc") // Optional: Show most recent first
        .collect();

      // Map to return only safe fields
      return connections.map(conn => ({
        _id: conn._id,
        provider: conn.provider,
        email: conn.email,
        label: conn.label,
      }));
    } catch (error: any) {
      console.error("Error fetching connections:", error.message);
      return []; 
    }
  },
});

/**
 * Delete a specific connection.
 * If the connection is used by any negotiations, it sets their connectionId to null instead of deleting.
 */
export const deleteConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    try {
      const user = await getUserOrThrow(ctx);
      const connectionId = args.connectionId;

      // Verify the connection belongs to the user before proceeding
      const connection = await ctx.db.get(connectionId);
      if (!connection) {
        // Already deleted or invalid ID
        console.warn(`Connection ${connectionId} not found for deletion.`);
        return { success: true, message: "Connection not found." };
      }
      if (connection.userId !== user._id) {
        throw new Error("User not authorized to delete this connection.");
      }

      // Find negotiations using this connection
      const negotiationsUsingConnection = await ctx.db
        .query("negotiations")
        .withIndex("by_connectionId", (q) => q.eq("connectionId", connectionId))
        .collect();

      if (negotiationsUsingConnection.length > 0) {
        // If used, update negotiations to remove the link
        console.log(`Connection ${connectionId} is used by ${negotiationsUsingConnection.length} negotiations. Unlinking them.`);
        for (const neg of negotiationsUsingConnection) {
          await ctx.db.patch(neg._id, { connectionId: undefined }); // Use undefined to clear optional field
        }
      }

      // Now delete the connection itself
      await ctx.db.delete(connectionId);
      console.log(`Connection ${connectionId} deleted successfully for user ${user._id}.`);
      return { success: true };

    } catch (error: any) {
      console.error(`Error deleting connection ${args.connectionId}:`, error);
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
    email: v.string(),
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
      // Since multiple Google accounts are now possible, we should check by email too.
      // However, let's first find *any* google connection for the user and then decide.
      // For simplicity now, we might just update the first one found or create new if none.
      // A better approach might involve checking args.email against existing connection emails.
      .first(); 

    // Data to be inserted or patched
    const connectionData: Partial<Doc<"connections">> & { email: string; provider: string; userId: Id<"users"> } = {
      userId: args.userId,
      provider: "google",
      email: args.email,
      scope: args.scopes.join(' '),
      accessToken: args.accessToken,
      // Only include refreshToken if it's provided 
      ...(args.refreshToken !== undefined && { refreshToken: args.refreshToken }),
    };

    // Check if an existing connection *with the same email* exists
    const connectionWithSameEmail = await ctx.db
      .query("connections")
      .withIndex("by_userId_email", q => q.eq("userId", args.userId).eq("email", args.email))
      .first();

    if (connectionWithSameEmail) {
      // Update the existing connection with this specific email
      await ctx.db.patch(connectionWithSameEmail._id, {
          scope: args.scopes.join(' '),
          accessToken: args.accessToken,
          ...(args.refreshToken !== undefined && { refreshToken: args.refreshToken }),
      });
      console.log(`Google connection updated for user ${args.userId}, email ${args.email} (Tokens stored UNSAFELY)`);
      return { connectionId: connectionWithSameEmail._id };
    } else {
      // Create new connection if no connection with this email exists for the user
      const connectionId = await ctx.db.insert("connections", {
        userId: args.userId,
        provider: "google",
        email: args.email,
        scope: args.scopes.join(' '),
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        // label will be undefined initially
      });
      console.log(`New Google connection created for user ${args.userId}, email ${args.email} (Tokens stored UNSAFELY)`);
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

// --- Internal query to get connection by ID ---
// Needed because actions cannot access db directly sometimes
export const getConnectionByIdInternal = internalQuery({
    args: { connectionId: v.id("connections") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.connectionId);
    }
});

// NOTE: Mutations/Actions for CREATING connections (OAuth handling)
// are intentionally omitted here. They require backend logic (HTTP Actions)
// to handle OAuth redirects, code exchange, and secure token storage. 