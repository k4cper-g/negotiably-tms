import { internalQuery, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Internal query to fetch the agent configuration for a specific negotiation.
 */
export const getByNegotiationId = internalQuery({
    args: { negotiationId: v.id("negotiations") },
    handler: async (
        ctx: QueryCtx, 
        args
    ): Promise<Doc<"agentConfigurations"> | null> => {
        const config = await ctx.db
            .query("agentConfigurations")
            .withIndex("by_negotiationId", (q) => q.eq("negotiationId", args.negotiationId))
            .first();
            
        return config;
    },
}); 