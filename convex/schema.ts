import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.string(),
    }),
    negotiations: defineTable({
        userId: v.string(),
        offerId: v.string(),
        status: v.string(),
        initialRequest: v.object({
            origin: v.string(),
            destination: v.string(),
            price: v.string(),
            loadType: v.optional(v.string()),
            weight: v.optional(v.string()),
            dimensions: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
        messages: v.array(v.object({
            sender: v.string(), // "user" or "carrier" 
            content: v.string(),
            timestamp: v.number(),
        })),
        counterOffers: v.array(v.object({
            price: v.string(),
            proposedBy: v.string(), // "user" or "carrier"
            timestamp: v.number(),
            status: v.string(), // "pending", "accepted", "rejected"
            notes: v.optional(v.string()),
        })),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
})
