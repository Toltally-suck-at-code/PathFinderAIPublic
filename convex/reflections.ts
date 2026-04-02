import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const REFLECTION_MAX_LENGTH = 2000;

function normalizeReflectionContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Reflection content cannot be empty");
  }
  if (trimmed.length > REFLECTION_MAX_LENGTH) {
    throw new Error(`Reflection content must be ${REFLECTION_MAX_LENGTH} characters or fewer.`);
  }
  return trimmed;
}

// Get user's reflections
export const getReflections = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let reflections = await ctx.db
      .query("reflections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.limit) {
      reflections = reflections.slice(0, args.limit);
    }

    return reflections;
  },
});

// Create a new reflection
export const createReflection = mutation({
  args: {
    content: v.string(),
    type: v.optional(v.union(v.literal("general"), v.literal("activity"), v.literal("monthly"))),
    activityId: v.optional(v.id("activities")),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedContent = normalizeReflectionContent(args.content);

    return await ctx.db.insert("reflections", {
      userId,
      content: normalizedContent,
      type: args.type || "general",
      activityId: args.activityId,
      prompt: args.prompt,
      createdAt: Date.now(),
    });
  },
});

// Update a reflection
export const updateReflection = mutation({
  args: {
    reflectionId: v.id("reflections"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reflection = await ctx.db.get(args.reflectionId);
    if (!reflection || reflection.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.reflectionId, {
      content: normalizeReflectionContent(args.content),
    });

    return args.reflectionId;
  },
});

// Delete a reflection
export const deleteReflection = mutation({
  args: { reflectionId: v.id("reflections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reflection = await ctx.db.get(args.reflectionId);
    if (!reflection || reflection.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.reflectionId);
    return true;
  },
});

// Get reflection count
export const getReflectionCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const reflections = await ctx.db
      .query("reflections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return reflections.length;
  },
});

// Get monthly prompts (predefined reflection prompts)
export const getMonthlyPrompts = query({
  args: {},
  handler: async () => {
    return [
      "What new skills have you developed this month?",
      "What challenges did you face and how did you overcome them?",
      "What activities or experiences made you feel most engaged?",
      "Do you want to adjust any of your goals based on what you've learned?",
      "What are you most proud of accomplishing this month?",
      "Is there anything you wish you had done differently?",
      "What do you want to focus on next month?",
    ];
  },
});
