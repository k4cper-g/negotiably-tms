import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to safely parse price string to number
const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  return parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
};

/**
 * Fetches aggregated statistics for the user's negotiations dashboard.
 */
export const getDashboardStats = query({
  args: {}, 
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log("Dashboard Stats: No user identity found.");
      return null; // Return null or default stats if no user
    }
    const clerkId = identity.subject; // Clerk User ID
    console.log(`Dashboard Stats: Clerk ID: ${clerkId}`); 

    // 1. Find the user document by Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .unique(); // Expecting one user per Clerk ID

    if (!user) {
      console.log(`Dashboard Stats: No user found for Clerk ID: ${clerkId}`);
      // Return default/empty stats if user record doesn't exist yet
      return {
        totalNegotiations: 0,
        activeNegotiations: 0,
        completedDeals: 0,
        rejectedNegotiations: 0,
        totalSavings: 0,
        averageSavings: 0,
        successRate: 0,
      };
    }
    
    const userInternalId = user._id; // This is the ID stored in negotiations.userId
    console.log(`Dashboard Stats: Found User Internal ID: ${userInternalId}`);

    // 2. Fetch negotiations using the user's internal Convex ID
    const negotiations = await ctx.db
      .query("negotiations")
      .filter((q) => q.eq(q.field("userId"), userInternalId)) // Use the correct ID
      .collect();
      
    console.log(`Dashboard Stats: Found ${negotiations.length} negotiations raw for internal ID ${userInternalId}.`); 

    let totalNegotiations = 0;
    let activeNegotiations = 0;
    let completedDeals = 0;
    let rejectedNegotiations = 0;
    let totalSavings = 0;
    let negotiationsWithProfit = 0;

    negotiations.forEach((neg) => {
      totalNegotiations++;
      
      // Count active negotiations (any pending status)
      if (neg.status === "pending" || neg.status === "active" || 
          neg.status === "pending_carrier" || neg.status === "pending_user" || 
          neg.status === "pending_initial") {
        activeNegotiations++;
      } 
      // Count completed deals (accepted negotiations)
      else if (neg.status === "accepted") {
        completedDeals++;
      } 
      // Count rejected negotiations
      else if (neg.status === "rejected" || neg.status === "cancelled") {
        rejectedNegotiations++;
      }
      
      // Calculate total savings from all negotiations with profit data
      if (neg.profit !== undefined) {
        totalSavings += neg.profit;
        negotiationsWithProfit++;
      } 
      // Fall back to calculating from prices if no stored profit
      else if (neg.status === "accepted") {
        const initialPrice = parsePrice(neg.initialRequest.price);
        
        // Check counter offers for accepted price
        const acceptedOffer = neg.counterOffers
          .slice() 
          .reverse()
          .find(offer => offer.status === "accepted");
          
        if (acceptedOffer) {
          const acceptedPrice = parsePrice(acceptedOffer.price);
          const profit = acceptedPrice - initialPrice; // Calculate profit properly
          totalSavings += profit;
          negotiationsWithProfit++;
        }
      }
    });

    // Calculate metrics
    const successRate = totalNegotiations > 0 ? (completedDeals / totalNegotiations) * 100 : 0;
    const averageSavings = negotiationsWithProfit > 0 ? totalSavings / negotiationsWithProfit : 0;
    
    return {
      totalNegotiations,
      activeNegotiations,
      completedDeals,
      rejectedNegotiations,
      totalSavings,
      averageSavings,
      successRate,
    };
  },
});


/**
 * Fetches the 5 most recently updated negotiations for the user's dashboard.
 */
export const getRecentNegotiations = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("Recent Negotiations: No user identity found.");
            return []; // Return empty array if no user
        }
        const clerkId = identity.subject;
        console.log(`Recent Negotiations: Clerk ID: ${clerkId}`); 

        // 1. Find the user document by Clerk ID
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), clerkId))
          .unique();

        if (!user) {
          console.log(`Recent Negotiations: No user found for Clerk ID: ${clerkId}`);
          return []; // Return empty array if user record doesn't exist yet
        }

        const userInternalId = user._id; // This is the ID stored in negotiations.userId
        console.log(`Recent Negotiations: Found User Internal ID: ${userInternalId}`);
        const limit = args.limit ?? 5; 

        // 2. Fetch negotiations using the user's internal Convex ID
        const recentNegotiations = await ctx.db
            .query("negotiations")
            .filter((q) => q.eq(q.field("userId"), userInternalId)) // Use the correct ID
            .order("desc") 
            .take(limit); 

        console.log(`Recent Negotiations: Found ${recentNegotiations.length} raw negotiations for internal ID ${userInternalId}.`); 

        // Map and return
        const mappedNegotiations = recentNegotiations.map(neg => ({
            _id: neg._id,
            origin: neg.initialRequest.origin,
            destination: neg.initialRequest.destination,
            status: neg.status,
            // Ensure 'updatedAt' exists and is a number in your schema, otherwise use _creationTime
            updatedAt: neg.updatedAt ?? neg._creationTime, 
        }));
        
        console.log(`Recent Negotiations: Returning ${mappedNegotiations.length} mapped negotiations.`);
        return mappedNegotiations;
    },
}); 