import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new negotiation
export const createNegotiation = mutation({
  args: {
    offerId: v.string(),
    initialRequest: v.object({
      origin: v.string(),
      destination: v.string(),
      price: v.string(),
      loadType: v.optional(v.string()),
      weight: v.optional(v.string()),
      dimensions: v.optional(v.string()),
      carrier: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Create the negotiation
    const negotiationId = await ctx.db.insert("negotiations", {
      userId: user._id.toString(),
      offerId: args.offerId,
      status: "pending", // initial status
      initialRequest: args.initialRequest,
      messages: [],
      counterOffers: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { negotiationId };
  },
});

// Get all negotiations for the current user
export const getUserNegotiations = query({
  args: {},
  handler: async (ctx) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all negotiations for this user
    const negotiations = await ctx.db
      .query("negotiations")
      .filter((q) => q.eq(q.field("userId"), user._id.toString()))
      .collect();

    return negotiations;
  },
});

// Get a specific negotiation by ID
export const getNegotiationById = query({
  args: { negotiationId: v.id("negotiations") },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id.toString()) {
      throw new Error("Unauthorized access to negotiation");
    }

    return negotiation;
  },
});

// Add a message to a negotiation
export const addMessage = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    message: v.string(),
    sender: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id.toString()) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Add message
    const newMessage = {
      sender: args.sender,
      content: args.message,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.negotiationId, {
      messages: [...negotiation.messages, newMessage],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Submit a counter offer
export const submitCounterOffer = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    price: v.string(),
    proposedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id.toString()) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Add counter offer
    const newCounterOffer = {
      price: args.price,
      proposedBy: args.proposedBy,
      timestamp: Date.now(),
      status: "pending",
      notes: args.notes,
    };

    await ctx.db.patch(args.negotiationId, {
      counterOffers: [...negotiation.counterOffers, newCounterOffer],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update negotiation status
export const updateNegotiationStatus = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id.toString()) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Update status
    await ctx.db.patch(args.negotiationId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update counter offer status
export const updateCounterOfferStatus = mutation({
  args: {
    negotiationId: v.id("negotiations"),
    offerIndex: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the negotiation
    const negotiation = await ctx.db.get(args.negotiationId);
    
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }

    // Check if user has access to this negotiation
    if (negotiation.userId !== user._id.toString()) {
      throw new Error("Unauthorized access to negotiation");
    }

    // Check if the counter offer exists
    if (args.offerIndex < 0 || args.offerIndex >= negotiation.counterOffers.length) {
      throw new Error("Counter offer not found");
    }

    // Update the counter offer status
    const updatedCounterOffers = [...negotiation.counterOffers];
    updatedCounterOffers[args.offerIndex] = {
      ...updatedCounterOffers[args.offerIndex],
      status: args.status,
    };

    // If accepting an offer, update the negotiation status as well
    let negotiationStatus = negotiation.status;
    if (args.status === "accepted") {
      negotiationStatus = "accepted";
    }

    await ctx.db.patch(args.negotiationId, {
      counterOffers: updatedCounterOffers,
      status: negotiationStatus,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a negotiation by ID
export const deleteNegotiation = mutation({
  args: {
    negotiationId: v.id("negotiations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Check if the negotiation exists
    const negotiation = await ctx.db.get(args.negotiationId);
    if (!negotiation) {
      throw new Error("Negotiation not found");
    }
    
    // Delete the negotiation
    await ctx.db.delete(args.negotiationId);
    
    return { success: true };
  },
}); 