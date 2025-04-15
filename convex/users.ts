import { query } from "./_generated/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Define default preferences
const defaultPreferences = {
  cities: ['London', 'Berlin', 'Warsaw'],
  currencies: ['USD', 'GBP', 'PLN']
};

export const syncUser = mutation(async ({ db, auth }, { clerkId, email, name, imageUrl }: { clerkId: string; email: string; name: string; imageUrl: string }) => {
    const existingUser = await db.query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .unique();
  
    if (existingUser) {
      await db.patch(existingUser._id, { email, name, imageUrl });
      return { status: "updated" };
    } else {
      // Create new user with default preferences
      await db.insert("users", { 
        clerkId, 
        email, 
        name, 
        imageUrl,
        topBarPreferences: defaultPreferences
      });
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
  
  // Query to get the current user's preferences, returning defaults if none exist
  export const getMyPreferences = query({
    args: {},
    handler: async (ctx) => {
      try {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          // Return defaults if not authenticated
          return defaultPreferences;
        }
  
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
          .unique();
  
        if (!user) {
          // This shouldn't happen if user is synced, but handle defensively
          console.error("User not found for authenticated identity");
          return defaultPreferences; 
        }
  
        // Return user's preferences or defaults if the field is missing/null
        return user.topBarPreferences ?? defaultPreferences;
      } catch (error) {
        // Log the error and return defaults to prevent client crashes
        console.error("Error in getMyPreferences:", error);
        return defaultPreferences;
      }
    },
  });
  
  // Mutation to update the current user's preferences
  export const updateMyPreferences = mutation({
    args: {
      cities: v.array(v.string()),
      currencies: v.array(v.string()),
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
  
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
  
      if (!user) {
        throw new Error("User not found for authenticated identity");
      }
      
      // Validate input arrays (optional, but good practice)
      if (args.cities.length > 10 || args.currencies.length > 10) {
        // Example validation: limit array sizes
        throw new Error("Cannot select more than 10 items for each category.");
      }

      // Update the user's preferences
      await ctx.db.patch(user._id, {
        topBarPreferences: {
          cities: args.cities,
          currencies: args.currencies,
        },
      });

      return { success: true };
    },
  });
  