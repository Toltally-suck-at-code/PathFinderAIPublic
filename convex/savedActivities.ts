import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's saved activities
export const getSavedActivities = query({
  args: {
    status: v.optional(v.union(v.literal("saved"), v.literal("in-progress"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let savedActivitiesQuery = ctx.db
      .query("savedActivities")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const savedActivities = await savedActivitiesQuery.collect();

    // Filter by status if provided
    let filtered = savedActivities;
    if (args.status) {
      filtered = savedActivities.filter((sa) => sa.status === args.status);
    }

    // Get the full activity details for each saved activity
    const result = await Promise.all(
      filtered.map(async (sa) => {
        const activity = await ctx.db.get(sa.activityId);
        return {
          ...sa,
          activity,
        };
      })
    );

    return result.filter((r) => r.activity !== null);
  },
});

// Check if an activity is saved by the user
export const isActivitySaved = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const saved = await ctx.db
      .query("savedActivities")
      .withIndex("by_user_activity", (q) =>
        q.eq("userId", userId).eq("activityId", args.activityId)
      )
      .first();

    return saved;
  },
});

// Save an activity to user's list
export const saveActivity = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already saved
    const existing = await ctx.db
      .query("savedActivities")
      .withIndex("by_user_activity", (q) =>
        q.eq("userId", userId).eq("activityId", args.activityId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Save the activity
    return await ctx.db.insert("savedActivities", {
      userId,
      activityId: args.activityId,
      status: "saved",
      savedAt: Date.now(),
    });
  },
});

// Update activity status
export const updateActivityStatus = mutation({
  args: {
    savedActivityId: v.id("savedActivities"),
    status: v.union(v.literal("saved"), v.literal("in-progress"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const savedActivity = await ctx.db.get(args.savedActivityId);
    if (!savedActivity || savedActivity.userId !== userId) {
      throw new Error("Not authorized");
    }

    const updateData: any = { status: args.status };
    if (args.status === "completed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(args.savedActivityId, updateData);
    return args.savedActivityId;
  },
});

// Remove activity from saved list
export const removeActivity = mutation({
  args: { savedActivityId: v.id("savedActivities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const savedActivity = await ctx.db.get(args.savedActivityId);
    if (!savedActivity || savedActivity.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.savedActivityId);
    return true;
  },
});

// Get user's activity stats
export const getActivityStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { saved: 0, inProgress: 0, completed: 0 };

    const savedActivities = await ctx.db
      .query("savedActivities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      saved: savedActivities.filter((sa) => sa.status === "saved").length,
      inProgress: savedActivities.filter((sa) => sa.status === "in-progress").length,
      completed: savedActivities.filter((sa) => sa.status === "completed").length,
    };
  },
});
