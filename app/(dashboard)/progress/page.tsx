"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<"activities" | "achievements" | "reflections">("activities");
  const [reflectionContent, setReflectionContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  // Fetch data from database
  const savedActivities = useQuery(api.savedActivities.getSavedActivities, {});
  const activityStats = useQuery(api.savedActivities.getActivityStats, {});
  const achievements = useQuery(api.achievements.getAchievements, {});
  const allAchievements = useQuery(api.achievements.getAllAchievements, {});
  const reflections = useQuery(api.reflections.getReflections, {});
  const monthlyPrompts = useQuery(api.reflections.getMonthlyPrompts, {});

  // Mutations
  const createReflection = useMutation(api.reflections.createReflection);
  const deleteReflection = useMutation(api.reflections.deleteReflection);
  const updateActivityStatus = useMutation(api.savedActivities.updateActivityStatus);
  const checkAchievements = useMutation(api.achievements.checkAndAwardAchievements);

  const handleSaveReflection = async () => {
    if (!reflectionContent.trim()) return;
    setIsSaving(true);
    try {
      await createReflection({ content: reflectionContent, type: "general" });
      await checkAchievements({});
      setReflectionContent("");
    } catch (error) {
      console.error("Failed to save reflection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (savedActivityId: Id<"savedActivities">, newStatus: "saved" | "in-progress" | "completed") => {
    try {
      await updateActivityStatus({ savedActivityId, status: newStatus });
      await checkAchievements({});
      setStatusMenuOpen(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteReflection = async (reflectionId: Id<"reflections">) => {
    try {
      await deleteReflection({ reflectionId });
    } catch (error) {
      console.error("Failed to delete reflection:", error);
    }
  };

  const statusColors: Record<string, string> = {
    saved: "bg-gray-200",
    "in-progress": "bg-[#6bb8ff]",
    completed: "bg-[#c8f560]",
  };

  const statusLabels: Record<string, string> = {
    saved: "SAVED",
    "in-progress": "IN PROGRESS",
    completed: "COMPLETED",
  };

  // Calculate skills progress from saved activities
  const skillsProgress = (() => {
    if (!savedActivities) return [];

    const skillCounts: Record<string, { total: number; completed: number }> = {};

    savedActivities.forEach((sa) => {
      if (sa.activity) {
        sa.activity.skills.forEach((skill) => {
          if (!skillCounts[skill]) {
            skillCounts[skill] = { total: 0, completed: 0 };
          }
          skillCounts[skill].total++;
          if (sa.status === "completed") {
            skillCounts[skill].completed++;
          }
        });
      }
    });

    return Object.entries(skillCounts)
      .map(([name, counts]) => ({
        name,
        progress: Math.round((counts.completed / counts.total) * 100),
        level: counts.completed === 0 ? "starter" : counts.completed >= counts.total * 0.5 ? "developing" : "starter",
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 4);
  })();

  const levelColors: Record<string, string> = {
    confident: "bg-[#c8f560]",
    developing: "bg-[#fff06b]",
    starter: "bg-gray-200",
  };

  // Loading state
  if (savedActivities === undefined || achievements === undefined) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="retro-card bg-white p-8 text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold">LOADING PROGRESS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="retro-card-blue p-4 mb-6">
        <h1 className="text-xl font-black uppercase">YOUR PROGRESS</h1>
        <p className="text-sm font-bold mt-1">Track activities, achievements, and skill development</p>
      </div>

      {/* Stats Overview */}
      {activityStats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="retro-card bg-white p-4 text-center">
            <p className="text-3xl font-black">{activityStats.saved}</p>
            <p className="text-xs font-bold uppercase text-gray-600">SAVED</p>
          </div>
          <div className="retro-card-blue p-4 text-center">
            <p className="text-3xl font-black">{activityStats.inProgress}</p>
            <p className="text-xs font-bold uppercase">IN PROGRESS</p>
          </div>
          <div className="retro-card-lime p-4 text-center">
            <p className="text-3xl font-black">{activityStats.completed}</p>
            <p className="text-xs font-bold uppercase">COMPLETED</p>
          </div>
        </div>
      )}

      {/* Skills Overview */}
      {skillsProgress.length > 0 && (
        <div className="retro-card bg-white p-6 mb-6">
          <h2 className="font-black uppercase mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span> SKILLS PROGRESS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillsProgress.map((skill) => (
              <div key={skill.name} className="border-3 border-black p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black uppercase text-sm">{skill.name}</span>
                  <span className={`retro-tag ${levelColors[skill.level]}`}>
                    {skill.level}
                  </span>
                </div>
                <div className="retro-progress">
                  <div
                    className="retro-progress-bar"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-gray-600 mt-2">{skill.progress}% complete</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "activities", label: "ACTIVITIES", emoji: "📋", count: savedActivities?.length || 0 },
          { id: "achievements", label: "ACHIEVEMENTS", emoji: "🏆", count: achievements?.length || 0 },
          { id: "reflections", label: "REFLECTIONS", emoji: "✍️", count: reflections?.length || 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`retro-btn text-xs py-2 px-3 flex items-center gap-2 ${
              activeTab === tab.id ? "retro-btn-lime" : ""
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
            {tab.count > 0 && (
              <span className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          {savedActivities && savedActivities.length > 0 ? (
            savedActivities.map((sa) => (
              <div key={sa._id} className="retro-card bg-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-black uppercase">{sa.activity?.title || "Unknown Activity"}</h3>
                  <p className="text-xs font-bold text-gray-600 mt-1">
                    Saved on {new Date(sa.savedAt).toLocaleDateString()}
                  </p>
                  {sa.activity && (
                    <div className="flex gap-2 mt-2">
                      {sa.activity.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="text-xs bg-gray-100 px-2 py-1 border-2 border-black">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 relative">
                  <span className={`retro-tag ${statusColors[sa.status]}`}>
                    {statusLabels[sa.status]}
                  </span>
                  <button
                    onClick={() => setStatusMenuOpen(statusMenuOpen === sa._id ? null : sa._id)}
                    className="w-8 h-8 border-3 border-black flex items-center justify-center hover:bg-gray-100"
                  >
                    <span>⋮</span>
                  </button>

                  {/* Status dropdown menu */}
                  {statusMenuOpen === sa._id && (
                    <div className="absolute right-0 top-full mt-2 z-10 bg-white border-3 border-black shadow-[4px_4px_0_0_#000]">
                      {(["saved", "in-progress", "completed"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(sa._id, status)}
                          className={`block w-full text-left px-4 py-2 text-sm font-bold uppercase hover:bg-gray-100 ${
                            sa.status === status ? "bg-gray-100" : ""
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">📋</p>
              <p className="font-bold uppercase">NO ACTIVITIES SAVED YET</p>
              <Link href="/activities" className="retro-btn retro-btn-lime mt-4 text-sm inline-block">
                EXPLORE ACTIVITIES →
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-4">
          {/* Earned achievements */}
          {achievements && achievements.length > 0 && (
            <>
              <h3 className="font-black uppercase text-sm text-gray-600 mb-2">EARNED ({achievements.length})</h3>
              {achievements.map((achievement) => (
                <div key={achievement._id} className="retro-card bg-white p-5 flex items-start gap-4">
                  <div className="w-14 h-14 bg-[#c8f560] border-3 border-black flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{achievement.emoji}</span>
                  </div>
                  <div>
                    <h3 className="font-black uppercase">{achievement.title}</h3>
                    <p className="text-sm font-bold text-gray-600 mt-1">{achievement.description}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">
                      Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Locked achievements */}
          {allAchievements && (
            <>
              <h3 className="font-black uppercase text-sm text-gray-600 mb-2 mt-6">
                LOCKED ({allAchievements.filter(a => !a.unlocked).length})
              </h3>
              {allAchievements.filter(a => !a.unlocked).map((achievement) => (
                <div key={achievement.id} className="retro-card bg-gray-100 p-5 flex items-start gap-4 opacity-60">
                  <div className="w-14 h-14 bg-gray-300 border-3 border-black flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-black uppercase">{achievement.title}</h3>
                    <p className="text-sm font-bold text-gray-600 mt-1">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {achievements?.length === 0 && (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">🏆</p>
              <p className="font-bold uppercase">NO ACHIEVEMENTS YET. KEEP LEARNING!</p>
              <p className="text-sm font-bold text-gray-600 mt-2">Complete the quiz and save activities to earn badges!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "reflections" && (
        <div>
          <div className="retro-card bg-white p-6 mb-6">
            <h3 className="font-black uppercase mb-4">ADD A REFLECTION</h3>
            <textarea
              placeholder="What did you learn recently? What challenges did you face?"
              className="retro-input w-full resize-none"
              rows={4}
              value={reflectionContent}
              onChange={(e) => setReflectionContent(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveReflection}
                disabled={isSaving || !reflectionContent.trim()}
                className="retro-btn retro-btn-lime text-sm disabled:opacity-50"
              >
                {isSaving ? "SAVING..." : "SAVE REFLECTION"}
              </button>
            </div>
          </div>

          {reflections && reflections.length > 0 ? (
            <div className="space-y-4">
              {reflections.map((reflection) => (
                <div key={reflection._id} className="retro-card bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{reflection.content}</p>
                      <p className="text-xs font-bold text-gray-400 mt-2">
                        {new Date(reflection.createdAt).toLocaleDateString()} • {reflection.type}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReflection(reflection._id)}
                      className="w-8 h-8 border-3 border-black flex items-center justify-center hover:bg-red-100 text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">✍️</p>
              <p className="font-bold uppercase">NO REFLECTIONS YET</p>
              <p className="text-sm font-bold text-gray-600 mt-2">Start journaling your learning journey!</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Prompt */}
      <div className="mt-8 retro-card-pink p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white border-3 border-black flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💭</span>
          </div>
          <div>
            <h3 className="font-black uppercase">MONTHLY CHECK-IN</h3>
            <p className="text-sm font-bold mt-2">
              {monthlyPrompts?.[Math.floor(Math.random() * monthlyPrompts.length)] ||
                "Take a moment to reflect: What new skills have you developed this month?"}
            </p>
            <button
              onClick={() => {
                setActiveTab("reflections");
                setReflectionContent(monthlyPrompts?.[0] || "");
              }}
              className="retro-btn retro-btn-yellow mt-4 text-sm"
            >
              START REFLECTION →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
