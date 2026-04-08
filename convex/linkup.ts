import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's linkup profile
export const getLinkupProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("linkupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Save or update linkup profile
export const saveOrUpdateProfile = mutation({
  args: {
    lookingFor: v.string(),
    interests: v.optional(v.array(v.string())),
    strengths: v.optional(v.array(v.string())),
    projectDescription: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("linkupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lookingFor: args.lookingFor,
        interests: args.interests ?? existing.interests,
        strengths: args.strengths ?? existing.strengths,
        projectDescription: args.projectDescription ?? existing.projectDescription,
        isVisible: args.isVisible ?? existing.isVisible,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("linkupProfiles", {
      userId,
      lookingFor: args.lookingFor,
      interests: args.interests ?? [],
      strengths: args.strengths ?? [],
      projectDescription: args.projectDescription ?? "",
      isVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get all visible teammate requests (excluding current user)
export const getTeammateRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    // Get all visible profiles
    const profiles = await ctx.db
      .query("linkupProfiles")
      .collect();

    // Filter to visible profiles with lookingFor text, excluding current user
    const visibleProfiles = profiles.filter(
      (p) => p.isVisible && p.lookingFor && p.lookingFor.trim() && p.userId !== userId
    );

    // Enrich with user info
    const enrichedProfiles = await Promise.all(
      visibleProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          _id: profile._id,
          lookingFor: profile.lookingFor,
          updatedAt: profile.updatedAt,
          user: user
            ? {
                id: user._id,
                name: user.name || "Anonymous",
                campus: user.campus || "Unknown",
                grade: user.grade || "Unknown",
              }
            : null,
        };
      })
    );

    // Sort by most recent
    return enrichedProfiles
      .filter((p) => p.user !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Get matches based on quiz responses
export const getMatches = query({
  args: {
    mode: v.union(v.literal("similar"), v.literal("complementary")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get current user's quiz responses
    const userQuiz = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userQuiz) return [];

    // Get current user info
    const currentUser = await ctx.db.get(userId);

    // Get all other users with quiz responses
    const allQuizResponses = await ctx.db.query("quizResponses").collect();
    const otherResponses = allQuizResponses.filter((qr) => qr.userId !== userId);

    // Calculate match scores
    const matches = await Promise.all(
      otherResponses.map(async (otherQuiz) => {
        const otherUser = await ctx.db.get(otherQuiz.userId);
        if (!otherUser) return null;

        // Check if user has linkup profile and is visible
        const linkupProfile = await ctx.db
          .query("linkupProfiles")
          .withIndex("by_user", (q) => q.eq("userId", otherQuiz.userId))
          .first();

        // Calculate similarity scores
        const interestsSimilarity = calculateArraySimilarity(
          userQuiz.responses.interests,
          otherQuiz.responses.interests
        );
        const strengthsSimilarity = calculateArraySimilarity(
          userQuiz.responses.strengths,
          otherQuiz.responses.strengths
        );
        const valuesSimilarity = calculateArraySimilarity(
          userQuiz.responses.values,
          otherQuiz.responses.values
        );
        const goalsSimilarity = calculateArraySimilarity(
          userQuiz.responses.goals,
          otherQuiz.responses.goals
        );

        // Working style comparison
        const workingStyleMatch =
          userQuiz.responses.workingStyle.teamPreference ===
            otherQuiz.responses.workingStyle.teamPreference &&
          userQuiz.responses.workingStyle.planningStyle ===
            otherQuiz.responses.workingStyle.planningStyle;

        let matchScore: number;
        let matchType: "similar" | "complementary";

        if (args.mode === "similar") {
          // High similarity = good match for similar mode
          matchScore = Math.round(
            (interestsSimilarity * 0.3 +
              strengthsSimilarity * 0.25 +
              valuesSimilarity * 0.25 +
              goalsSimilarity * 0.2) *
              100
          );
          matchType = "similar";
        } else {
          // Low similarity in strengths = complementary
          // But similar values/goals = aligned team
          const complementScore = 1 - strengthsSimilarity;
          matchScore = Math.round(
            (complementScore * 0.4 + valuesSimilarity * 0.3 + goalsSimilarity * 0.3) * 100
          );
          matchType = "complementary";
        }

        // Only return matches above 40%
        if (matchScore < 40) return null;

        return {
          id: otherUser._id,
          name: otherUser.name || "Anonymous",
          grade: otherUser.grade || "Unknown",
          campus: otherUser.campus || "Unknown",
          email: otherUser.email,
          interests: otherQuiz.responses.interests.slice(0, 3),
          strengths: otherQuiz.responses.strengths.slice(0, 3),
          matchScore,
          matchType,
          lookingFor: linkupProfile?.lookingFor || "",
          projectDescription: linkupProfile?.projectDescription || "",
        };
      })
    );

    // Filter out nulls and sort by match score
    return matches
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  },
});

// Helper function to calculate array similarity (Jaccard index)
function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;

  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Create introduction request
export const createIntroRequest = mutation({
  args: {
    toUserId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.toUserId) {
      throw new Error("Cannot send intro request to yourself");
    }

    // Check if already sent a request
    const existing = await ctx.db
      .query("introRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("toUserId"), args.toUserId))
      .first();

    if (existing) {
      throw new Error("Introduction request already sent");
    }

    return await ctx.db.insert("introRequests", {
      fromUserId: userId,
      toUserId: args.toUserId,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get received introduction requests
export const getReceivedIntroRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("introRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .collect();

    // Enrich with sender info
    return Promise.all(
      requests.map(async (req) => {
        const fromUser = await ctx.db.get(req.fromUserId);
        return {
          ...req,
          fromUser: fromUser
            ? {
                name: fromUser.name,
                email: fromUser.email,
                campus: fromUser.campus,
                grade: fromUser.grade,
              }
            : null,
        };
      })
    );
  },
});

// Get sent introduction requests
export const getSentIntroRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("introRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .collect();

    // Enrich with recipient info
    return Promise.all(
      requests.map(async (req) => {
        const toUser = await ctx.db.get(req.toUserId);
        return {
          ...req,
          toUser: toUser
            ? {
                name: toUser.name,
                email: toUser.email,
                campus: toUser.campus,
                grade: toUser.grade,
              }
            : null,
        };
      })
    );
  },
});

// Respond to introduction request
export const respondToIntroRequest = mutation({
  args: {
    requestId: v.id("introRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.toUserId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.requestId, {
      status: args.accept ? "accepted" : "declined",
      respondedAt: Date.now(),
    });

    return args.requestId;
  },
});

// Get connection count (accepted intro requests)
export const getConnectionCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const sentAccepted = await ctx.db
      .query("introRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const receivedAccepted = await ctx.db
      .query("introRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    return sentAccepted.length + receivedAccepted.length;
  },
});
