import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    campus: v.optional(v.string()),
    grade: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, string | boolean> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.campus !== undefined) updates.campus = args.campus;
    if (args.grade !== undefined) updates.grade = args.grade;

    // Check if profile is now complete
    const user = await ctx.db.get(userId);
    if (user && args.name && args.campus && args.grade) {
      updates.profileComplete = true;
    }

    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

// Get user by ID (for counselors viewing students)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) throw new Error("User not found");

    // Only counselors and admins can view other users
    if (currentUser.role !== "counselor" && currentUser.role !== "admin") {
      throw new Error("Not authorized");
    }

    return await ctx.db.get(args.userId);
  },
});

// List all students (for counselors)
export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Only counselors and admins can list students
    if (user.role !== "counselor" && user.role !== "admin") {
      throw new Error("Not authorized");
    }

    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
  },
});
