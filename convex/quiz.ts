import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Quiz questions data
export const quizQuestions = {
  interests: {
    title: "What subjects or activities do you enjoy most?",
    description: "Select all that apply",
    type: "multi-select",
    options: [
      "Mathematics & Logic",
      "Science & Experiments",
      "Literature & Writing",
      "History & Social Studies",
      "Art & Design",
      "Music & Performance",
      "Technology & Coding",
      "Sports & Physical Activities",
      "Business & Economics",
      "Languages & Communication",
      "Environmental Studies",
      "Psychology & Human Behavior",
    ],
  },
  strengths: {
    title: "What are your strongest abilities?",
    description: "Select your top 3-5 strengths",
    type: "multi-select",
    options: [
      "Analytical thinking",
      "Creative problem-solving",
      "Communication & presentation",
      "Leadership & organizing",
      "Attention to detail",
      "Working with hands",
      "Understanding people",
      "Learning quickly",
      "Staying calm under pressure",
      "Thinking outside the box",
      "Collaborating with others",
      "Working independently",
    ],
  },
  workingStyle: {
    teamPreference: {
      title: "How do you prefer to work?",
      type: "single-select",
      options: [
        { value: "solo", label: "I prefer working alone" },
        { value: "small-team", label: "I like small teams (2-4 people)" },
        { value: "large-team", label: "I thrive in larger groups" },
        { value: "mixed", label: "It depends on the task" },
      ],
    },
    planningStyle: {
      title: "How do you approach tasks?",
      type: "single-select",
      options: [
        { value: "planner", label: "I plan everything in advance" },
        { value: "flexible", label: "I prefer to stay flexible and adapt" },
        { value: "mixed", label: "I plan the big picture, improvise details" },
        { value: "deadline", label: "I work best under deadline pressure" },
      ],
    },
  },
  values: {
    title: "What matters most to you in a future career?",
    description: "Select your top 3 values",
    type: "multi-select",
    options: [
      "Making a positive impact",
      "Financial stability",
      "Creative freedom",
      "Continuous learning",
      "Work-life balance",
      "Leadership opportunities",
      "Helping others directly",
      "Recognition and prestige",
      "Innovation and cutting-edge work",
      "Job security",
      "Travel and new experiences",
      "Flexibility and autonomy",
    ],
  },
  goals: {
    title: "What are your long-term aspirations?",
    description: "Select all that resonate with you",
    type: "multi-select",
    options: [
      "Start my own business",
      "Become an expert in my field",
      "Lead teams or organizations",
      "Create art or content",
      "Solve global problems",
      "Help my local community",
      "Achieve financial independence",
      "Balance career with family life",
      "Continuously learn and grow",
      "Travel and work internationally",
      "Make scientific discoveries",
      "Teach and mentor others",
    ],
  },
};

// Get current user's quiz responses
export const getQuizResponses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const responses = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return responses;
  },
});

// Save quiz responses
export const saveQuizResponses = mutation({
  args: {
    responses: v.object({
      interests: v.array(v.string()),
      strengths: v.array(v.string()),
      workingStyle: v.object({
        teamPreference: v.string(),
        planningStyle: v.string(),
      }),
      values: v.array(v.string()),
      goals: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has quiz responses
    const existing = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing responses
      await ctx.db.patch(existing._id, {
        responses: args.responses,
        completedAt: Date.now(),
        version: existing.version + 1,
      });
      return existing._id;
    } else {
      // Create new responses
      return await ctx.db.insert("quizResponses", {
        userId,
        responses: args.responses,
        completedAt: Date.now(),
        version: 1,
      });
    }
  },
});

// Get current user's quiz response (alias for getQuizResponses)
export const getQuizResponse = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const responses = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return responses;
  },
});

// Check if user has completed quiz
export const hasCompletedQuiz = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;

    const responses = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return responses !== null;
  },
});
