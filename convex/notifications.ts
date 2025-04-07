import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

// Helper function to get user or throw error if not authenticated
async function getUserOrThrow(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User not authenticated.");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found in database.");
  }
  return user;
}

// Get all notifications for the current user
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    filter: v.optional(v.union(
      v.literal("all"),
      v.literal("unread"),
      v.literal("agent")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    const limit = args.limit ?? 25;
    
    let q = ctx.db.query("notifications")
      .withIndex("by_userId", q => q.eq("userId", user._id))
      .order("desc");
    
    // Apply filters
    if (args.filter === "unread") {
      q = ctx.db.query("notifications")
        .withIndex("by_userId_isRead", q => 
          q.eq("userId", user._id).eq("isRead", false))
        .order("desc");
    } else if (args.filter === "agent") {
      q = q.filter(q => 
        q.or(
          q.eq(q.field("type"), "agent_needs_review"),
          q.eq(q.field("type"), "agent_price_increase"),
          q.eq(q.field("type"), "agent_new_terms")
        )
      );
    }
    
    // Get notifications with limit
    const notifications = await q.take(limit);
    
    // Count unread notifications
    const unreadCount = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", q => 
        q.eq("userId", user._id).eq("isRead", false))
      .collect()
      .then(results => results.length);
    
    return {
      notifications,
      unreadCount
    };
  },
});

// Mark a notification as read
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized to update this notification");
    }
    
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
    
    return { success: true };
  },
});

// Mark all notifications as read
export const markAllNotificationsRead = mutation({
  args: {
    filter: v.optional(v.union(
      v.literal("all"),
      v.literal("agent")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    
    let query = ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", q => 
        q.eq("userId", user._id).eq("isRead", false));
    
    if (args.filter === "agent") {
      query = query.filter(q => 
        q.or(
          q.eq(q.field("type"), "agent_needs_review"),
          q.eq(q.field("type"), "agent_price_increase"),
          q.eq(q.field("type"), "agent_new_terms")
        )
      );
    }
    
    const notifications = await query.collect();
    
    await Promise.all(
      notifications.map(notification => 
        ctx.db.patch(notification._id, { isRead: true })
      )
    );
    
    return { success: true, count: notifications.length };
  },
});

// Internal mutation to create a notification
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("agent_needs_review"),
      v.literal("agent_price_increase"),
      v.literal("agent_new_terms"),
      v.literal("negotiation_update")
    ),
    title: v.string(),
    content: v.string(),
    sourceId: v.optional(v.id("negotiations")),
    sourceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create the notification
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      content: args.content,
      sourceId: args.sourceId,
      sourceName: args.sourceName,
      isRead: false,
      createdAt: Date.now(),
    });
    
    return { notificationId };
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized to delete this notification");
    }
    
    await ctx.db.delete(args.notificationId);
    
    return { success: true };
  },
});

// Clear all notifications
export const clearAllNotifications = mutation({
  args: {
    filter: v.optional(v.union(
      v.literal("all"),
      v.literal("unread"),
      v.literal("agent")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    
    let query = ctx.db
      .query("notifications")
      .withIndex("by_userId", q => q.eq("userId", user._id));
      
    // Filter based on the provided filter type
    if (args.filter === "unread") {
      // If clearing 'unread', we actually want to delete READ notifications
      query = query.filter(q => q.eq(q.field("isRead"), true)); 
    } else if (args.filter === "agent") {
      query = query.filter(q => 
        q.or(
          q.eq(q.field("type"), "agent_needs_review"),
          q.eq(q.field("type"), "agent_price_increase"),
          q.eq(q.field("type"), "agent_new_terms")
        )
      );
    } // 'all' filter needs no additional .filter()
    
    const notifications = await query.collect();
    
    await Promise.all(
      notifications.map(notification => 
        ctx.db.delete(notification._id)
      )
    );
    
    return { success: true, count: notifications.length };
  },
}); 