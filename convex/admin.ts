import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if current user is admin
async function isAdmin(ctx: any): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;

  const user = await ctx.db.get(userId);
  return user?.role === "admin";
}

// Get system overview stats
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    if (!await isAdmin(ctx)) return null;

    // Get total users
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;

    // Get users who completed quiz
    const quizResponses = await ctx.db.query("quizResponses").collect();
    const quizCompleted = quizResponses.length;

    // Get career maps generated
    const careerMaps = await ctx.db.query("careerMaps").collect();

    // Get total saved activities
    const savedActivities = await ctx.db.query("savedActivities").collect();

    // Get total intro requests
    const introRequests = await ctx.db.query("introRequests").collect();
    const pendingRequests = introRequests.filter((r) => r.status === "pending").length;

    // Calculate daily/weekly/monthly new signups
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const newToday = allUsers.filter((u) => u.createdAt > oneDayAgo).length;
    const newThisWeek = allUsers.filter((u) => u.createdAt > oneWeekAgo).length;
    const newThisMonth = allUsers.filter((u) => u.createdAt > oneMonthAgo).length;

    return {
      totalUsers,
      quizCompleted,
      careerMapsGenerated: careerMaps.length,
      totalSavedActivities: savedActivities.length,
      totalConnections: introRequests.filter((r) => r.status === "accepted").length,
      pendingRequests,
      newToday,
      newThisWeek,
      newThisMonth,
    };
  },
});

// Get all users for admin management
export const getAllUsers = query({
  args: {
    role: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!await isAdmin(ctx)) return [];

    let users = await ctx.db.query("users").collect();

    // Filter by role
    if (args.role && args.role !== "all") {
      users = users.filter((u) => u.role === args.role);
    }

    // Search by name or email
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    // Enrich with activity data
    return Promise.all(
      users.map(async (user) => {
        const quiz = await ctx.db
          .query("quizResponses")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
        const careerMap = await ctx.db
          .query("careerMaps")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
        const savedActivities = await ctx.db
          .query("savedActivities")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        const achievements = await ctx.db
          .query("achievements")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        return {
          _id: user._id,
          name: user.name || "Unknown",
          email: user.email,
          campus: user.campus || "Not set",
          grade: user.grade || "Not set",
          role: user.role || "student",
          profileComplete: user.profileComplete || false,
          createdAt: user.createdAt,
          hasCompletedQuiz: !!quiz,
          hasCareerMap: !!careerMap,
          savedActivitiesCount: savedActivities.length,
          completedActivitiesCount: savedActivities.filter((a) => a.status === "completed").length,
          achievementsCount: achievements.length,
        };
      })
    );
  },
});

// Update user role
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("student"),
      v.literal("counselor"),
      v.literal("partner"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    if (!await isAdmin(ctx)) {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return args.userId;
  },
});

// Get activities overview
export const getActivitiesOverview = query({
  args: {},
  handler: async (ctx) => {
    if (!await isAdmin(ctx)) return null;

    const activities = await ctx.db.query("activities").collect();

    // Get saved count per activity
    const savedActivities = await ctx.db.query("savedActivities").collect();

    const activityStats = activities.map((activity) => {
      const saves = savedActivities.filter((sa) => sa.activityId === activity._id);
      return {
        _id: activity._id,
        title: activity.title,
        category: activity.category || "Uncategorized",
        source: activity.source,
        savedCount: saves.length,
        completedCount: saves.filter((s) => s.status === "completed").length,
        engagementRate:
          saves.length > 0
            ? Math.round((saves.filter((s) => s.status !== "saved").length / saves.length) * 100)
            : 0,
      };
    });

    return activityStats.sort((a, b) => b.savedCount - a.savedCount);
  },
});

// Get recent activity (audit log)
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!await isAdmin(ctx)) return [];

    const limit = args.limit || 50;

    // Get recent quiz completions
    const quizResponses = await ctx.db.query("quizResponses").collect();
    const careerMaps = await ctx.db.query("careerMaps").collect();
    const introRequests = await ctx.db.query("introRequests").collect();
    const achievements = await ctx.db.query("achievements").collect();

    const activities: Array<{
      type: string;
      userId: string;
      timestamp: number;
      details: string;
    }> = [];

    // Add quiz completions
    quizResponses.forEach((qr) => {
      activities.push({
        type: "quiz_completed",
        userId: qr.userId,
        timestamp: qr.completedAt,
        details: "Completed Pathfinder quiz",
      });
    });

    // Add career map generations
    careerMaps.forEach((cm) => {
      activities.push({
        type: "career_map_generated",
        userId: cm.userId,
        timestamp: cm.generatedAt,
        details: "Generated career map",
      });
    });

    // Add intro requests
    introRequests.forEach((ir) => {
      activities.push({
        type: "intro_request",
        userId: ir.fromUserId,
        timestamp: ir.createdAt,
        details: `Sent intro request (${ir.status})`,
      });
    });

    // Add achievements
    achievements.forEach((a) => {
      activities.push({
        type: "achievement",
        userId: a.userId,
        timestamp: a.earnedAt,
        details: `Earned: ${a.title}`,
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});