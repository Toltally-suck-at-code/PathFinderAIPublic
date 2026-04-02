import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const LOOKING_FOR_MAX_LENGTH = 280;
const INTRO_MESSAGE_MAX_LENGTH = 280;
const MAX_PENDING_INTRO_REQUESTS = 5;
const INTRO_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_INTRO_REQUESTS_PER_WINDOW = 5;
const EMAIL_REVEAL_PENDING = "Accepted — use your verified Vinschool email to continue the conversation.";

function normalizeRequiredText(value: string, fieldName: string, maxLength: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function getConnectionEmail(status: "pending" | "accepted" | "declined", email: string | undefined) {
  if (status !== "accepted") return null;
  return email ?? EMAIL_REVEAL_PENDING;
}

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
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedLookingFor = normalizeRequiredText(
      args.lookingFor,
      "Looking for text",
      LOOKING_FOR_MAX_LENGTH
    );

    const existing = await ctx.db
      .query("linkupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lookingFor: normalizedLookingFor,
        isVisible: args.isVisible ?? existing.isVisible,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("linkupProfiles", {
      userId,
      lookingFor: normalizedLookingFor,
      isVisible: args.isVisible ?? true,
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

    const userQuiz = await ctx.db
      .query("quizResponses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userQuiz) return [];

    const allQuizResponses = await ctx.db.query("quizResponses").collect();
    const otherResponses = allQuizResponses.filter((qr) => qr.userId !== userId);

    const matches = await Promise.all(
      otherResponses.map(async (otherQuiz) => {
        const otherUser = await ctx.db.get(otherQuiz.userId);
        if (!otherUser || !otherUser.profileComplete) return null;

        const linkupProfile = await ctx.db
          .query("linkupProfiles")
          .withIndex("by_user", (q) => q.eq("userId", otherQuiz.userId))
          .first();

        if (linkupProfile && !linkupProfile.isVisible) {
          return null;
        }

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

        let matchScore: number;
        let matchType: "similar" | "complementary";

        if (args.mode === "similar") {
          matchScore = Math.round(
            (interestsSimilarity * 0.3 +
              strengthsSimilarity * 0.25 +
              valuesSimilarity * 0.25 +
              goalsSimilarity * 0.2) *
              100
          );
          matchType = "similar";
        } else {
          const complementScore = 1 - strengthsSimilarity;
          matchScore = Math.round(
            (complementScore * 0.4 + valuesSimilarity * 0.3 + goalsSimilarity * 0.3) * 100
          );
          matchType = "complementary";
        }

        if (matchScore < 40) return null;

        return {
          id: otherUser._id,
          name: otherUser.name || "Anonymous",
          grade: otherUser.grade || "Unknown",
          campus: otherUser.campus || "Unknown",
          interests: otherQuiz.responses.interests.slice(0, 3),
          strengths: otherQuiz.responses.strengths.slice(0, 3),
          matchScore,
          matchType,
          lookingFor: linkupProfile?.lookingFor || "",
        };
      })
    );

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

    const message = normalizeRequiredText(args.message, "Introduction message", INTRO_MESSAGE_MAX_LENGTH);
    const recipient = await ctx.db.get(args.toUserId);
    if (!recipient || recipient.role !== "student") {
      throw new Error("This student is not available for LinkUp requests.");
    }

    const recipientProfile = await ctx.db
      .query("linkupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.toUserId))
      .first();
    if (recipientProfile && !recipientProfile.isVisible) {
      throw new Error("This student is not currently visible in LinkUp.");
    }

    const existing = await ctx.db
      .query("introRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("toUserId"), args.toUserId))
      .first();

    if (existing) {
      throw new Error("Introduction request already sent");
    }

    const sentRequests = await ctx.db
      .query("introRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .collect();

    const now = Date.now();
    const recentRequests = sentRequests.filter(
      (request) => now - request.createdAt <= INTRO_REQUEST_WINDOW_MS
    );
    if (recentRequests.length >= MAX_INTRO_REQUESTS_PER_WINDOW) {
      throw new Error("You have reached today’s introduction limit. Please try again tomorrow.");
    }

    const pendingRequests = sentRequests.filter((request) => request.status === "pending");
    if (pendingRequests.length >= MAX_PENDING_INTRO_REQUESTS) {
      throw new Error("You already have too many pending introductions. Wait for a response first.");
    }

    return await ctx.db.insert("introRequests", {
      fromUserId: userId,
      toUserId: args.toUserId,
      message,
      status: "pending",
      createdAt: now,
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
                email: getConnectionEmail(req.status, fromUser.email),
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
                email: getConnectionEmail(req.status, toUser.email),
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

    if (request.status !== "pending") {
      throw new Error("This introduction request has already been handled.");
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
