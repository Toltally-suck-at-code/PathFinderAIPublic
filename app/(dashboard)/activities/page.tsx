"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const categories = [
  { id: "all", label: "ALL", emoji: "📋" },
  { id: "academic", label: "ACADEMIC", emoji: "📚" },
  { id: "technology", label: "TECHNOLOGY", emoji: "💻" },
  { id: "arts", label: "ARTS", emoji: "🎨" },
  { id: "leadership", label: "LEADERSHIP", emoji: "👑" },
  { id: "business", label: "BUSINESS", emoji: "💼" },
  { id: "service", label: "SERVICE", emoji: "🤝" },
];

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Fetch activities from database
  const activities = useQuery(api.activities.getActivities, {
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    difficulty: selectedDifficulty ?? undefined,
    search: searchQuery || undefined,
  });

  // Fetch saved activities
  const savedActivities = useQuery(api.savedActivities.getSavedActivities, {});
  const saveActivity = useMutation(api.savedActivities.saveActivity);
  const removeActivity = useMutation(api.savedActivities.removeActivity);
  const seedActivities = useMutation(api.activities.seedActivities);

  // Check achievements after saving
  const checkAchievements = useMutation(api.achievements.checkAndAwardAchievements);

  // Create a set of saved activity IDs for quick lookup
  const savedActivityIds = new Set(
    savedActivities?.map((sa) => sa.activityId) || []
  );

  // Get savedActivity record by activityId
  const getSavedRecord = (activityId: Id<"activities">) => {
    return savedActivities?.find((sa) => sa.activityId === activityId);
  };

  const handleToggleSave = async (activityId: Id<"activities">) => {
    const savedRecord = getSavedRecord(activityId);
    if (savedRecord) {
      await removeActivity({ savedActivityId: savedRecord._id });
    } else {
      await saveActivity({ activityId });
      await checkAchievements({});
    }
  };

  // Seed activities if none exist
  useEffect(() => {
    if (activities && activities.length === 0) {
      seedActivities({});
    }
  }, [activities]);

  const difficultyColors: Record<string, string> = {
    beginner: "bg-[#c8f560]",
    intermediate: "bg-[#fff06b]",
    advanced: "bg-[#ff8fab]",
  };

  // Filter for saved only view
  const displayActivities = showSavedOnly
    ? activities?.filter((a) => savedActivityIds.has(a._id))
    : activities;

  const savedCount = savedActivities?.length || 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="retro-card-lime p-4 mb-6">
        <h1 className="text-xl font-black uppercase">EXPLORE ACTIVITIES</h1>
        <p className="text-sm font-bold mt-1">Discover clubs, competitions, and opportunities</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`retro-btn text-xs py-2 px-3 flex items-center gap-2 ${
              selectedCategory === cat.id ? "retro-btn-lime" : ""
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="retro-card bg-white p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="retro-input w-full"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            {["beginner", "intermediate", "advanced"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedDifficulty(selectedDifficulty === level ? null : level)}
                className={`retro-btn text-xs py-2 px-3 uppercase ${
                  selectedDifficulty === level ? difficultyColors[level] : ""
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Activities Count */}
      {savedCount > 0 && (
        <div className="retro-card-blue p-4 mb-6 flex items-center justify-between">
          <p className="font-bold text-sm">
            <span className="text-lg">{savedCount}</span> ACTIVITIES SAVED TO YOUR PATH
          </p>
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`retro-btn text-xs ${showSavedOnly ? "retro-btn-lime" : ""}`}
          >
            {showSavedOnly ? "SHOW ALL" : "VIEW SAVED →"}
          </button>
        </div>
      )}

      {/* Loading State */}
      {activities === undefined && (
        <div className="retro-card bg-white p-8 text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold">LOADING ACTIVITIES...</p>
        </div>
      )}

      {/* Activities Grid */}
      {displayActivities && displayActivities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayActivities.map((activity) => {
            const isSaved = savedActivityIds.has(activity._id);
            return (
              <div key={activity._id} className="retro-card bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-black uppercase">{activity.title}</h3>
                    <span className={`retro-tag ${difficultyColors[activity.difficulty]} mt-2`}>
                      {activity.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSave(activity._id)}
                    className={`w-10 h-10 border-3 border-black flex items-center justify-center transition-colors ${
                      isSaved ? "bg-[#6bb8ff]" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{isSaved ? "★" : "☆"}</span>
                  </button>
                </div>

                <p className="text-sm font-bold text-gray-600 mb-4">{activity.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {activity.skills.map((skill) => (
                    <span key={skill} className="retro-tag bg-gray-100">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm font-bold border-t-3 border-black pt-3 mt-3">
                  <span className="flex items-center gap-1">
                    <span>⏱</span> {activity.timeRequired}
                  </span>
                  <span className={`retro-tag ${activity.source === "school" ? "bg-[#c8f560]" : "bg-[#c4b5fd]"}`}>
                    {activity.source === "school" ? "SCHOOL" : "PARTNER"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {displayActivities && displayActivities.length === 0 && (
        <div className="retro-card bg-white text-center py-12">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold">
            {showSavedOnly ? "NO SAVED ACTIVITIES YET" : "NO ACTIVITIES MATCH YOUR FILTERS"}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedDifficulty(null);
              setShowSavedOnly(false);
            }}
            className="retro-btn retro-btn-lime mt-4 text-sm"
          >
            CLEAR FILTERS
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 retro-card-yellow p-4">
        <p className="text-xs font-bold text-center">
          💡 TIP: Save activities to your path and track your progress over time.
          The more activities you complete, the more achievements you unlock!
        </p>
      </div>
    </div>
  );
}
