import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api"; // Import the generated API
import { Doc, Id } from "./_generated/dataModel"; // Import Doc and Id

// Query to get all email templates for the current user
export const getEmailTemplates = query({
  args: {},
  handler: async (ctx): Promise<Doc<"emailTemplates">[]> => {
    let user: Doc<"users"> | null = null;
    try {
      // Correctly call the query using ctx.runQuery
      user = await ctx.runQuery(api.users.getCurrentUser);
    } catch (e) {
      console.warn("Attempted to get email templates without authenticated user.", e);
      return [];
    }

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("emailTemplates")
      .withIndex("by_userId", (q) => q.eq("userId", user!._id))
      .order("desc") // Optional: order by creation time or name
      .collect();
  },
});

// Mutation to create a new email template
export const createEmailTemplate = mutation({
  args: {
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"emailTemplates">> => {
    let user: Doc<"users"> | null = null;
    try {
      // Correctly call the query using ctx.runQuery
      user = await ctx.runQuery(api.users.getCurrentUser);
    } catch (e) {
      console.error("Authentication error during template creation:", e);
      throw new Error("Authentication required to create a template.");
    }

    if (!user) {
      throw new Error("Authentication failed or user not found.");
    }
    
    if (!args.name || args.name.trim().length === 0) {
        throw new Error("Template name cannot be empty.");
    }
    
    if (!args.content || args.content.trim().length === 0) {
        throw new Error("Template content cannot be empty.");
    }

    const templateId = await ctx.db.insert("emailTemplates", {
      userId: user._id,
      name: args.name,
      content: args.content,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// Mutation to delete an email template
export const deleteEmailTemplate = mutation({
  args: { templateId: v.id("emailTemplates") },
  handler: async (ctx, args): Promise<void> => {
    let user: Doc<"users"> | null = null;
    try {
      // Correctly call the query using ctx.runQuery
      user = await ctx.runQuery(api.users.getCurrentUser);
    } catch (e) {
      console.error("Authentication error during template deletion:", e);
      throw new Error("Authentication required to delete a template.");
    }
    
    if (!user) {
      throw new Error("Authentication failed or user not found.");
    }

    // Optional: Verify the user owns the template before deleting
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found.");
    }
    if (template.userId !== user._id) {
      throw new Error("You do not have permission to delete this template.");
    }

    await ctx.db.delete(args.templateId);
  },
}); 