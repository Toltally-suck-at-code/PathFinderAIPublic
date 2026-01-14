import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = [
  {
    type: "quiz_completed",
    title: "Self-Discovery",
    description: "Completed the Discover Yourself quiz",
    emoji: "🎯",
    skills: ["self-awareness"],
  },
  {
    type: "career_map_generated",
    title: "Pathfinder",
    description: "Generated your personalized Career Map",
    emoji: "🗺️",
    skills: ["planning"],
  },
  {
    type: "first_activity_saved",
    title: "Getting Started",
    description: "Saved your first activity to your path",
    emoji: "📌",
    skills: ["initiative"],
  },
  {
    type: "five_activities_saved",
    title: "Activity Explorer",
    description: "Saved 5 activities to your path",
    emoji: "📚",
    skills: ["exploration"],
  },
  {
    type: "first_activity_completed",
    title: "Achievement Unlocked",
    description: "Completed your first activity",
    emoji: "✅",
    skills: ["commitment"],
  },
  {
    type: "three_activities_completed",
    title: "On a Roll",
    description: "Completed 3 activities",
    emoji: "🔥",
    skills: ["persistence"],
  },
  {
    type: "first_reflection",
    title: "Self-Aware",
    description: "Wrote your first reflection",
    emoji: "✍️",
    skills: ["self-reflection"],
  },
  {
    type: "five_reflections",
    title: "Deep Thinker",
    description: "Wrote 5 reflections",
    emoji: "🧠",
    skills: ["introspection"],
  },
  {
    type: "first_connection",
    title: "Team Player",
    description: "Made your first LinkUp connection",
    emoji: "🤝",
    skills: ["networking"],
  },
  {
    type: "profile_complete",
    title: "Identity Established",
    description: "Completed your profile information",
    emoji: "👤",
    skills: ["organization"],
  },
];

// Helper to get definition by type
const getDefinition = (type: string) => {
  return ACHIEVEMENT_DEFINITIONS.find((d) => d.type === type) || {
    type,
    title: type,
    description: "",
    emoji: "🏆",
    skills: [],
  };
};

// Get user's achievements
export const getAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich with definitions
    return achievements.map((a) => {
      const definition = getDefinition(a.type);
      return {
        ...a,
        title: a.title || definition.title,
        description: a.description || definition.description,
        emoji: a.emoji || definition.emoji,
      };
    });
  },
});

// Get all available achievements with unlock status
export const getAllAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    let userAchievementTypes: string[] = [];
    if (userId) {
      const achievements = await ctx.db
        .query("achievements")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      userAchievementTypes = achievements.map((a) => a.type);
    }

    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      id: def.type,
      unlocked: userAchievementTypes.includes(def.type),
    }));
  },
});

// Award an achievement to user
export const awardAchievement = mutation({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already has this achievement
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      return existing._id;
    }

    const definition = getDefinition(args.type);

    // Award the achievement
    return await ctx.db.insert("achievements", {
      userId,
      type: args.type,
      title: definition.title,
      description: definition.description,
      emoji: definition.emoji,
      skills: definition.skills,
      earnedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Helper to award achievement if not exists
async function awardIfNotExists(
  ctx: any,
  userId: any,
  type: string
): Promise<boolean> {
  const existing = await ctx.db
    .query("achievements")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("type"), type))
    .first();

  if (existing) return false;

  const definition = getDefinition(type);
  await ctx.db.insert("achievements", {
    userId,
    type,
    title: definition.title,
    description: definition.description,
    emoji: definition.emoji,
    skills: definition.skills,
    earnedAt: Date.now(),
    createdAt: Date.now(),
  });
  return true;
}

// Check and award achievements based on user's progress
export const checkAndAwardAchievements = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const awarded: string[] = [];

    // Get user data
    const user = await ctx.db.get(userId);

    // Check quiz completed
    const quizResponse = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (quizResponse) {
      if (await awardIfNotExists(ctx, userId, "quiz_completed")) {
        awarded.push("quiz_completed");
      }
    }

    // Check career map generated
    const careerMap = await ctx.db
      .query("careerMaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (careerMap) {
      if (await awardIfNotExists(ctx, userId, "career_map_generated")) {
        awarded.push("career_map_generated");
      }
    }

    // Check saved activities
    const savedActivities = await ctx.db
      .query("savedActivities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (savedActivities.length >= 1) {
      if (await awardIfNotExists(ctx, userId, "first_activity_saved")) {
        awarded.push("first_activity_saved");
      }
    }

    if (savedActivities.length >= 5) {
      if (await awardIfNotExists(ctx, userId, "five_activities_saved")) {
        awarded.push("five_activities_saved");
      }
    }

    // Check completed activities
    const completedActivities = savedActivities.filter((sa) => sa.status === "completed");
    if (completedActivities.length >= 1) {
      if (await awardIfNotExists(ctx, userId, "first_activity_completed")) {
        awarded.push("first_activity_completed");
      }
    }

    if (completedActivities.length >= 3) {
      if (await awardIfNotExists(ctx, userId, "three_activities_completed")) {
        awarded.push("three_activities_completed");
      }
    }

    // Check reflections
    const reflections = await ctx.db
      .query("reflections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (reflections.length >= 1) {
      if (await awardIfNotExists(ctx, userId, "first_reflection")) {
        awarded.push("first_reflection");
      }
    }

    if (reflections.length >= 5) {
      if (await awardIfNotExists(ctx, userId, "five_reflections")) {
        awarded.push("five_reflections");
      }
    }

    // Check profile complete
    if (user?.name && user?.campus && user?.grade) {
      if (await awardIfNotExists(ctx, userId, "profile_complete")) {
        awarded.push("profile_complete");
      }
    }

    return { awarded };
  },
});

// Get achievement count
export const getAchievementCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return achievements.length;
  },
});
