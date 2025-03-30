import { query } from "./_generated/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation(async ({ db, auth }, { clerkId, email, name, imageUrl }: { clerkId: string; email: string; name: string; imageUrl: string }) => {
    const existingUser = await db.query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .unique();
  
    if (existingUser) {
      await db.patch(existingUser._id, { email, name, imageUrl });
      return { status: "updated" };
    } else {
      await db.insert("users", { clerkId, email, name, imageUrl });
      return { status: "created" };
    }
  });
  
  export const getAllUsers = query({
      args: {},
      handler: async (ctx, args) => {
          const users = await ctx.db.query("users").collect();
          return users;
      }
  })
  
  export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
  
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();
  
      if (!user) {
        throw new Error("User not found");
      }
  
      return user;
    },
  });
  