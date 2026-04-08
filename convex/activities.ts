import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all activities with optional filters
export const getActivities = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    search: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let activities = await ctx.db.query("activities").collect();

    // Filter by category
    if (args.category && args.category !== "all") {
      activities = activities.filter((a) => a.category === args.category);
    }

    // Filter by difficulty
    if (args.difficulty) {
      activities = activities.filter((a) => a.difficulty === args.difficulty);
    }

    // Filter by search term
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      activities = activities.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by skills
    if (args.skills && args.skills.length > 0) {
      activities = activities.filter((a) =>
        args.skills!.some((skill) => a.skills.includes(skill))
      );
    }

    // Filter out expired activities
    const now = Date.now();
    activities = activities.filter((a) => !a.endDate || a.endDate > now);

    return activities;
  },
});

// Get a single activity by ID
export const getActivityById = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activityId);
  },
});

// Get all unique skills from activities
export const getAllSkills = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    const skillsSet = new Set<string>();
    activities.forEach((a) => a.skills.forEach((s) => skillsSet.add(s)));
    return Array.from(skillsSet).sort();
  },
});

// Get all categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    const categoriesSet = new Set<string>();
    activities.forEach((a) => {
      if (a.category) categoriesSet.add(a.category);
    });
    return Array.from(categoriesSet).sort();
  },
});

// Create a new activity (admin/partner only)
export const createActivity = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    timeRequired: v.string(),
    category: v.string(),
    source: v.union(v.literal("school"), v.literal("partner")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Seed initial activities (run once)
export const seedActivities = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if activities already exist
    const existing = await ctx.db.query("activities").first();
    if (existing) {
      return { message: "Activities already seeded" };
    }

    const sampleActivities = [
      {
        title: "Vinschool Coding Club",
        description: "Learn programming fundamentals and build projects with peers. Weekly sessions covering Python, JavaScript, and web development basics.",
        skills: ["Programming", "Problem-solving", "Teamwork"],
        difficulty: "beginner" as const,
        timeRequired: "2 hours/week",
        category: "technology",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Model United Nations",
        description: "Debate global issues and develop public speaking skills. Represent countries in simulated UN conferences.",
        skills: ["Public Speaking", "Research", "Critical Thinking", "Diplomacy"],
        difficulty: "intermediate" as const,
        timeRequired: "4 hours/week",
        category: "leadership",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Science Olympiad",
        description: "Compete in science competitions at regional and national levels. Covers biology, chemistry, physics, and earth science.",
        skills: ["Scientific Method", "Laboratory Skills", "Teamwork", "Research"],
        difficulty: "advanced" as const,
        timeRequired: "5 hours/week",
        category: "academic",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Creative Writing Workshop",
        description: "Develop your writing skills with guided sessions and feedback. Explore fiction, poetry, and creative non-fiction.",
        skills: ["Writing", "Creativity", "Self-expression", "Critical Analysis"],
        difficulty: "beginner" as const,
        timeRequired: "2 hours/week",
        category: "arts",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Entrepreneurship Challenge",
        description: "Create a business plan and pitch to real investors. Learn startup fundamentals and business strategy.",
        skills: ["Business Planning", "Presentation", "Financial Literacy", "Leadership"],
        difficulty: "intermediate" as const,
        timeRequired: "6 hours/week",
        category: "business",
        source: "partner" as const,
        createdAt: Date.now(),
      },
      {
        title: "Community Service Program",
        description: "Volunteer at local organizations and make a positive impact. Build empathy and leadership skills.",
        skills: ["Leadership", "Empathy", "Communication", "Teamwork"],
        difficulty: "beginner" as const,
        timeRequired: "3 hours/week",
        category: "service",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Robotics Team",
        description: "Design, build, and program robots for competitions. Learn mechanical engineering and programming.",
        skills: ["Engineering", "Programming", "Problem-solving", "Teamwork"],
        difficulty: "intermediate" as const,
        timeRequired: "5 hours/week",
        category: "technology",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Debate Club",
        description: "Develop argumentation and critical thinking skills through structured debates on current issues.",
        skills: ["Public Speaking", "Critical Thinking", "Research", "Persuasion"],
        difficulty: "intermediate" as const,
        timeRequired: "3 hours/week",
        category: "leadership",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Math Olympiad Prep",
        description: "Prepare for national and international mathematics competitions. Advanced problem-solving techniques.",
        skills: ["Mathematics", "Problem-solving", "Logical Thinking", "Perseverance"],
        difficulty: "advanced" as const,
        timeRequired: "4 hours/week",
        category: "academic",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Digital Art & Design",
        description: "Learn digital illustration, graphic design, and UI/UX basics using industry-standard tools.",
        skills: ["Digital Art", "Graphic Design", "Creativity", "Visual Communication"],
        difficulty: "beginner" as const,
        timeRequired: "3 hours/week",
        category: "arts",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Environmental Action Club",
        description: "Lead sustainability initiatives on campus and in the community. Plan eco-friendly projects.",
        skills: ["Environmental Science", "Leadership", "Project Management", "Communication"],
        difficulty: "beginner" as const,
        timeRequired: "2 hours/week",
        category: "service",
        source: "school" as const,
        createdAt: Date.now(),
      },
      {
        title: "Finance & Investment Club",
        description: "Learn about personal finance, stock markets, and investment strategies through simulations.",
        skills: ["Financial Literacy", "Analytical Thinking", "Decision Making", "Research"],
        difficulty: "intermediate" as const,
        timeRequired: "2 hours/week",
        category: "business",
        source: "school" as const,
        createdAt: Date.now(),
      },
    ];

    for (const activity of sampleActivities) {
      await ctx.db.insert("activities", activity);
    }

    return { message: "Seeded 12 activities successfully" };
  },
});
