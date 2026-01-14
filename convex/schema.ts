import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User profiles (extends auth user data)
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    campus: v.optional(v.string()),
    grade: v.optional(v.string()),
    role: v.union(
      v.literal("student"),
      v.literal("counselor"),
      v.literal("partner"),
      v.literal("admin")
    ),
    profileComplete: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Quiz responses
  quizResponses: defineTable({
    userId: v.id("users"),
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
    completedAt: v.number(),
    updatedAt: v.optional(v.number()),
    version: v.number(),
  }).index("by_user", ["userId"]),

  // Career maps
  careerMaps: defineTable({
    userId: v.id("users"),
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
    generatedAt: v.number(),
    version: v.number(),
  }).index("by_user", ["userId"]),

  // Activities/Opportunities
  activities: defineTable({
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    timeRequired: v.string(),
    category: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    source: v.union(v.literal("school"), v.literal("partner")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_source", ["source"])
    .index("by_category", ["category"]),

  // Saved activities (user's path)
  savedActivities: defineTable({
    userId: v.id("users"),
    activityId: v.id("activities"),
    status: v.union(
      v.literal("saved"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
    notes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_activity", ["userId", "activityId"]),

  // Achievements
  achievements: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    emoji: v.optional(v.string()),
    skills: v.array(v.string()),
    evidence: v.optional(v.string()),
    earnedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  // Reflections
  reflections: defineTable({
    userId: v.id("users"),
    activityId: v.optional(v.id("activities")),
    content: v.string(),
    type: v.optional(v.union(
      v.literal("general"),
      v.literal("activity"),
      v.literal("monthly")
    )),
    prompt: v.optional(v.string()),
    learnings: v.optional(v.string()),
    challenges: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // LinkUp profiles
  linkupProfiles: defineTable({
    userId: v.id("users"),
    lookingFor: v.string(),
    interests: v.optional(v.array(v.string())),
    strengths: v.optional(v.array(v.string())),
    projectDescription: v.optional(v.string()),
    isVisible: v.boolean(),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Introduction requests
  introRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user", ["toUserId"]),

  // AI chat messages (for quiz clarification)
  chatMessages: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
