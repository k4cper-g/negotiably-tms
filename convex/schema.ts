import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.string(),
        topBarPreferences: v.optional(v.object({
            cities: v.array(v.string()),
            currencies: v.array(v.string()),
        })),
    }).index("by_clerkId", ["clerkId"]),
    demoRequests: defineTable({
        email: v.string(),
        message: v.optional(v.string()),
        status: v.string(), // "new", "contacted", "completed"
        createdAt: v.number(),
    }),
    negotiations: defineTable({
        userId: v.id("users"),
        offerId: v.string(),
        status: v.string(),
        currentPrice: v.optional(v.string()),
        initialRequest: v.object({
            platform: v.optional(v.string()),
            origin: v.string(),
            destination: v.string(),
            price: v.string(),
            distance: v.optional(v.string()),
            loadType: v.optional(v.string()),
            weight: v.optional(v.string()),
            dimensions: v.optional(v.string()),
            carrier: v.optional(v.string()),
            notes: v.optional(v.string()),
            offerContactEmail: v.optional(v.string()),
        }),
        messages: v.array(v.object({
            sender: v.string(), // "user" or "ai" or "carrier_system"
            content: v.string(),
            timestamp: v.number(),
            emailMessageId: v.optional(v.string())
        })),
        counterOffers: v.array(v.object({
            price: v.string(),
            proposedBy: v.string(), // "user" or "ai" or "carrier_system"
            timestamp: v.number(),
            status: v.string(), // "pending", "accepted", "rejected"
            notes: v.optional(v.string()),
        })),
        createdAt: v.number(),
        updatedAt: v.number(),
        emailThreadId: v.optional(v.string()),
        lastEmailMessageId: v.optional(v.string()),
        emailSubject: v.optional(v.string()),
        emailCcRecipients: v.optional(v.array(v.string())),
        isAgentActive: v.optional(v.boolean()),
        agentTargetPricePerKm: v.optional(v.number()),
        agentState: v.optional(v.union(v.literal("needs_review"), v.literal("error"))),
        agentMessage: v.optional(v.string()),
        agentReplyCount: v.optional(v.number()),
        profit: v.optional(v.number()),
        connectionId: v.optional(v.id("connections")),
    }).index("by_userId", ["userId"]).index("by_offerId", ["offerId"]).index("by_connectionId", ["connectionId"]),
    connections: defineTable({
        userId: v.id("users"),
        provider: v.string(),
        email: v.string(),
        label: v.optional(v.string()),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
        scope: v.optional(v.string()),
    }).index("by_userId_provider", ["userId", "provider"]).index("by_userId_email", ["userId", "email"]),
    oauthStates: defineTable({
        userId: v.id("users"), // User who initiated the flow
        stateValue: v.string(),   // The unique random state string
    }).index("by_stateValue", ["stateValue"]),
    agentConfigurations: defineTable({
        negotiationId: v.id("negotiations"),
        userId: v.id("users"),
        style: v.union(
            v.literal("conservative"),
            v.literal("balanced"),
            v.literal("aggressive")
        ),
        notifyOnPriceChange: v.boolean(),
        notifyOnNewTerms: v.boolean(),
        maxAutoReplies: v.number(),
        notifyAfterRounds: v.number(),
        notifyOnTargetPriceReached: v.optional(v.boolean()),
        notifyOnAgreement: v.optional(v.boolean()),
        notifyOnConfusion: v.optional(v.boolean()),
        notifyOnRefusal: v.optional(v.boolean()),
        bypassTargetPriceCheck: v.optional(v.boolean()),
        bypassAgreementCheck: v.optional(v.boolean()),
        bypassConfusionCheck: v.optional(v.boolean()),
        bypassRefusalCheck: v.optional(v.boolean()),
    }).index("by_negotiationId", ["negotiationId"]).index("by_userId", ["userId"]),
    
    notifications: defineTable({
        userId: v.id("users"),
        type: v.union(
            v.literal("agent_needs_review"),
            v.literal("agent_price_increase"),
            v.literal("agent_new_terms"),
            v.literal("negotiation_update")
        ),
        title: v.string(),
        content: v.string(),
        sourceId: v.optional(v.id("negotiations")), // Optional link to negotiation
        sourceName: v.optional(v.string()), // Readable name of the source (e.g., route name)
        isRead: v.boolean(),
        createdAt: v.number(),
    }).index("by_userId", ["userId"])
      .index("by_userId_isRead", ["userId", "isRead"])
      .index("by_createdAt", ["createdAt"]),
      
    // New table for email templates
    emailTemplates: defineTable({
        userId: v.id("users"),      // Link to the user who owns the template
        name: v.string(),           // Name of the template (e.g., "Initial Contact", "Follow-up")
        content: v.string(),        // The actual email template content
        createdAt: v.number(),      // Timestamp when the template was created
    }).index("by_userId", ["userId"]), // Index for efficient querying by user
})
