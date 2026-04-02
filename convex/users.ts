import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

const PROFILE_NAME_MAX_LENGTH = 80;
const CAMPUS_MAX_LENGTH = 80;
const GRADE_MAX_LENGTH = 40;

type UserRole = "student" | "counselor" | "partner" | "admin";

function normalizeOptionalText(value: string | undefined, fieldName: string, maxLength: number) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

async function requireStaffUser(ctx: Parameters<typeof auth.getUserId>[0]) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  if (user.role !== "counselor" && user.role !== "admin") {
    throw new Error("Not authorized");
  }

  return { userId, user };
}

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

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const nextName = args.name !== undefined
      ? normalizeOptionalText(args.name, "Name", PROFILE_NAME_MAX_LENGTH)
      : user.name;
    const nextCampus = args.campus !== undefined
      ? normalizeOptionalText(args.campus, "Campus", CAMPUS_MAX_LENGTH)
      : user.campus;
    const nextGrade = args.grade !== undefined
      ? normalizeOptionalText(args.grade, "Grade", GRADE_MAX_LENGTH)
      : user.grade;

    const updates: Record<string, string | boolean | undefined> = {};
    if (args.name !== undefined) updates.name = nextName;
    if (args.campus !== undefined) updates.campus = nextCampus;
    if (args.grade !== undefined) updates.grade = nextGrade;

    updates.profileComplete = !!(nextName && nextCampus && nextGrade);

    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

// Get user by ID (for counselors viewing students)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireStaffUser(ctx);
    return await ctx.db.get(args.userId);
  },
});

// List all students (for counselors)
export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    await requireStaffUser(ctx);

    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("counselor"), v.literal("partner"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const { user: actor } = await requireStaffUser(ctx);
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    if (actor.role !== "admin") {
      if (args.role === "admin") {
        throw new Error("Only admins can assign admin role");
      }
      if (targetUser.role === "admin") {
        throw new Error("Only admins can modify admin accounts");
      }
    }

    await ctx.db.patch(args.userId, { role: args.role as UserRole });
    return await ctx.db.get(args.userId);
  },
});
