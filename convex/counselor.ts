import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all students with summaries (counselor only)
export const getStudentSummaries = query({
  args: {
    campus: v.optional(v.string()),
    grade: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is counselor
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "counselor") {
      throw new Error("Not authorized - counselor access only");
    }

    // Get all students
    let students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    // Filter by campus
    if (args.campus) {
      students = students.filter((s) => s.campus === args.campus);
    }

    // Filter by grade
    if (args.grade) {
      students = students.filter((s) => s.grade === args.grade);
    }

    // Get summaries for each student
    const summaries = await Promise.all(
      students.map(async (student) => {
        // Get quiz response
        const quizResponse = await ctx.db
          .query("quizResponses")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .first();

        // Get career map
        const careerMap = await ctx.db
          .query("careerMaps")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .first();

        // Get saved activities count
        const savedActivities = await ctx.db
          .query("savedActivities")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .collect();

        // Get achievements count
        const achievements = await ctx.db
          .query("achievements")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .collect();

        // Get reflections count
        const reflections = await ctx.db
          .query("reflections")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .collect();

        return {
          id: student._id,
          name: student.name || "Unknown",
          email: student.email,
          campus: student.campus || "Unknown",
          grade: student.grade || "Unknown",
          profileComplete: !!(student.name && student.campus && student.grade),
          hasCompletedQuiz: !!quizResponse,
          hasCareerMap: !!careerMap,
          topCareerClusters: careerMap?.clusters.map((c) => c.name).slice(0, 3) || [],
          interests: quizResponse?.responses.interests.slice(0, 5) || [],
          strengths: quizResponse?.responses.strengths.slice(0, 5) || [],
          savedActivitiesCount: savedActivities.length,
          completedActivitiesCount: savedActivities.filter((sa) => sa.status === "completed")
            .length,
          achievementsCount: achievements.length,
          reflectionsCount: reflections.length,
          lastActive: quizResponse?.completedAt || student._creationTime,
        };
      })
    );

    return summaries.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
  },
});

// Get interest trends (aggregate data)
export const getInterestTrends = query({
  args: {
    campus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is counselor
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "counselor") {
      throw new Error("Not authorized - counselor access only");
    }

    // Get all quiz responses
    const quizResponses = await ctx.db.query("quizResponses").collect();

    // If filtering by campus, get user IDs for that campus
    let filteredResponses = quizResponses;
    if (args.campus) {
      const campusStudents = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("campus"), args.campus))
        .collect();
      const campusUserIds = new Set(campusStudents.map((s) => s._id));
      filteredResponses = quizResponses.filter((qr) => campusUserIds.has(qr.userId));
    }

    // Aggregate interests
    const interestCounts: Record<string, number> = {};
    const strengthCounts: Record<string, number> = {};
    const valueCounts: Record<string, number> = {};
    const goalCounts: Record<string, number> = {};

    filteredResponses.forEach((qr) => {
      qr.responses.interests.forEach((i) => {
        interestCounts[i] = (interestCounts[i] || 0) + 1;
      });
      qr.responses.strengths.forEach((s) => {
        strengthCounts[s] = (strengthCounts[s] || 0) + 1;
      });
      qr.responses.values.forEach((v) => {
        valueCounts[v] = (valueCounts[v] || 0) + 1;
      });
      qr.responses.goals.forEach((g) => {
        goalCounts[g] = (goalCounts[g] || 0) + 1;
      });
    });

    // Sort and return top items
    const sortByCount = (obj: Record<string, number>) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    return {
      totalStudents: filteredResponses.length,
      topInterests: sortByCount(interestCounts),
      topStrengths: sortByCount(strengthCounts),
      topValues: sortByCount(valueCounts),
      topGoals: sortByCount(goalCounts),
    };
  },
});

// Get career cluster distribution
export const getCareerClusterDistribution = query({
  args: {
    campus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is counselor
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "counselor") {
      throw new Error("Not authorized - counselor access only");
    }

    // Get all career maps
    const careerMaps = await ctx.db.query("careerMaps").collect();

    // If filtering by campus, get user IDs for that campus
    let filteredMaps = careerMaps;
    if (args.campus) {
      const campusStudents = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("campus"), args.campus))
        .collect();
      const campusUserIds = new Set(campusStudents.map((s) => s._id));
      filteredMaps = careerMaps.filter((cm) => campusUserIds.has(cm.userId));
    }

    // Aggregate career clusters
    const clusterCounts: Record<string, number> = {};

    filteredMaps.forEach((cm) => {
      cm.clusters.forEach((cluster, index) => {
        // Weight by position (1st = 3 points, 2nd = 2 points, 3rd = 1 point)
        const weight = Math.max(3 - index, 1);
        clusterCounts[cluster.name] = (clusterCounts[cluster.name] || 0) + weight;
      });
    });

    return Object.entries(clusterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
  },
});

// Export student data as CSV-ready format
export const exportStudentData = query({
  args: {
    campus: v.optional(v.string()),
    grade: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is counselor
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "counselor") {
      throw new Error("Not authorized - counselor access only");
    }

    // Get all students
    let students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    // Filter by campus
    if (args.campus) {
      students = students.filter((s) => s.campus === args.campus);
    }

    // Filter by grade
    if (args.grade) {
      students = students.filter((s) => s.grade === args.grade);
    }

    // Build export data
    const exportData = await Promise.all(
      students.map(async (student) => {
        const quizResponse = await ctx.db
          .query("quizResponses")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .first();

        const careerMap = await ctx.db
          .query("careerMaps")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .first();

        const savedActivities = await ctx.db
          .query("savedActivities")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .collect();

        const achievements = await ctx.db
          .query("achievements")
          .withIndex("by_user", (q) => q.eq("userId", student._id))
          .collect();

        return {
          name: student.name || "",
          email: student.email || "",
          campus: student.campus || "",
          grade: student.grade || "",
          quizCompleted: quizResponse ? "Yes" : "No",
          careerMapGenerated: careerMap ? "Yes" : "No",
          topCareerCluster1: careerMap?.clusters[0]?.name || "",
          topCareerCluster2: careerMap?.clusters[1]?.name || "",
          topCareerCluster3: careerMap?.clusters[2]?.name || "",
          interests: quizResponse?.responses.interests.join("; ") || "",
          strengths: quizResponse?.responses.strengths.join("; ") || "",
          savedActivities: savedActivities.length,
          completedActivities: savedActivities.filter((sa) => sa.status === "completed").length,
          achievements: achievements.length,
        };
      })
    );

    return exportData;
  },
});

// Get activity progress overview
export const getActivityProgressOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is counselor
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "counselor") {
      throw new Error("Not authorized - counselor access only");
    }

    const allSavedActivities = await ctx.db.query("savedActivities").collect();
    const allActivities = await ctx.db.query("activities").collect();

    // Count by activity
    const activityStats: Record<
      string,
      { title: string; saved: number; inProgress: number; completed: number }
    > = {};

    for (const activity of allActivities) {
      activityStats[activity._id] = {
        title: activity.title,
        saved: 0,
        inProgress: 0,
        completed: 0,
      };
    }

    for (const sa of allSavedActivities) {
      const activityId = sa.activityId;
      if (activityStats[activityId]) {
        if (sa.status === "saved") activityStats[activityId].saved++;
        else if (sa.status === "in-progress") activityStats[activityId].inProgress++;
        else if (sa.status === "completed") activityStats[activityId].completed++;
      }
    }

    return Object.values(activityStats)
      .filter((s) => s.saved + s.inProgress + s.completed > 0)
      .sort((a, b) => b.saved + b.inProgress + b.completed - (a.saved + a.inProgress + a.completed));
  },
});
