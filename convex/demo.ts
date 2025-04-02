import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutation to store a demo request from the website
 */
export const storeDemoRequest = mutation({
  args: {
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store the demo request in the database
    const demoRequestId = await ctx.db.insert("demoRequests", {
      email: args.email,
      message: args.message,
      status: "new", // Initial status for new demo requests
      createdAt: Date.now(),
    });

    return { success: true, id: demoRequestId };
  },
});

/**
 * Query to get all demo requests (for admin panel)
 */
export const listDemoRequests = query({
  handler: async (ctx) => {
    // In a real app, you'd add authentication to ensure only admins can access this
    return await ctx.db.query("demoRequests").collect();
  },
}); 