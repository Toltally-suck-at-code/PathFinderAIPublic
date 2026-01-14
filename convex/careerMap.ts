import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Get current user's career map
export const getCareerMap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const careerMap = await ctx.db
      .query("careerMaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return careerMap;
  },
});

// Save generated career map
export const saveCareerMap = mutation({
  args: {
    clusters: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        whyItFits: v.string(),
      })
    ),
    subjects: v.array(
      v.object({
        name: v.string(),
        priority: v.string(),
        reason: v.string(),
      })
    ),
    skills: v.object({
      hard: v.array(
        v.object({
          name: v.string(),
          howToPractice: v.string(),
        })
      ),
      soft: v.array(
        v.object({
          name: v.string(),
          howToPractice: v.string(),
        })
      ),
    }),
    learningPaths: v.array(
      v.object({
        step: v.number(),
        title: v.string(),
        description: v.string(),
        timeframe: v.string(),
      })
    ),
    extracurriculars: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has a career map
    const existing = await ctx.db
      .query("careerMaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing career map
      await ctx.db.patch(existing._id, {
        clusters: args.clusters,
        subjects: args.subjects,
        skills: args.skills,
        learningPaths: args.learningPaths,
        extracurriculars: args.extracurriculars,
        generatedAt: Date.now(),
        version: existing.version + 1,
      });
      return existing._id;
    } else {
      // Create new career map
      return await ctx.db.insert("careerMaps", {
        userId,
        clusters: args.clusters,
        subjects: args.subjects,
        skills: args.skills,
        learningPaths: args.learningPaths,
        extracurriculars: args.extracurriculars,
        generatedAt: Date.now(),
        version: 1,
      });
    }
  },
});

// Check if user has a career map
export const hasCareerMap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;

    const careerMap = await ctx.db
      .query("careerMaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return careerMap !== null;
  },
});
