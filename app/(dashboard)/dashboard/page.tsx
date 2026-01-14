"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrentUser);
  const quizResponse = useQuery(api.quiz.getQuizResponse, {});
  const careerMap = useQuery(api.careerMap.getCareerMap, {});
  const activityStats = useQuery(api.savedActivities.getActivityStats, {});
  const connectionCount = useQuery(api.linkup.getConnectionCount, {});
  const achievements = useQuery(api.achievements.getAchievements, {});

  const hasCompletedQuiz = !!quizResponse;
  const hasCareerMap = !!careerMap;
  const savedActivitiesCount =
    (activityStats?.saved || 0) +
    (activityStats?.inProgress || 0) +
    (activityStats?.completed || 0);
  const achievementsCount = achievements?.length || 0;
  const connectionsCount = connectionCount || 0;

  const quickActions = [
    {
      title: "DISCOVER YOURSELF",
      description: "Complete a quiz to understand your strengths and interests",
      href: "/discover",
      emoji: "💡",
      color: "lime",
      status: hasCompletedQuiz ? "COMPLETED" : "START QUIZ",
      completed: hasCompletedQuiz,
    },
    {
      title: "CAREER MAP",
      description: "View your personalized career clusters, skills, and learning paths",
      href: "/career-map",
      emoji: "🗺️",
      color: "blue",
      status: hasCareerMap ? "VIEW MAP" : "GENERATE",
      completed: hasCareerMap,
    },
    {
      title: "EXPLORE ACTIVITIES",
      description: "Browse clubs, competitions, and opportunities",
      href: "/activities",
      emoji: "📋",
      color: "yellow",
      status: savedActivitiesCount > 0 ? `${savedActivitiesCount} SAVED` : "EXPLORE",
      completed: savedActivitiesCount > 0,
    },
    {
      title: "LINKUP",
      description: "Find teammates with similar or complementary strengths",
      href: "/linkup",
      emoji: "🤝",
      color: "pink",
      status: connectionsCount > 0 ? `${connectionsCount} CONNECTED` : "FIND MATCHES",
      completed: connectionsCount > 0,
    },
  ];

  const colorClasses: Record<string, string> = {
    lime: "retro-card-lime",
    blue: "retro-card-blue",
    yellow: "retro-card-yellow",
    pink: "retro-card-pink",
  };

  const isProfileComplete = user?.name && user?.campus && user?.grade;

  // Calculate checklist progress
  const checklistItems = [
    { text: "Sign in with Vinschool account", completed: true },
    { text: "Complete your profile", completed: isProfileComplete },
    { text: "Complete the Discover Yourself quiz", completed: hasCompletedQuiz },
    { text: "View your personalized Career Map", completed: hasCareerMap },
    { text: "Save an activity to your path", completed: savedActivitiesCount > 0 },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome Section */}
      <div className="retro-card-lime p-6 mb-6">
        <h1 className="text-2xl font-black uppercase">
          WELCOME BACK{user?.name ? `, ${user.name.split(" ")[0].toUpperCase()}` : ""}!
        </h1>
        <p className="font-bold mt-2">
          {!isProfileComplete
            ? "Complete your profile and quiz to get started on your career journey."
            : hasCompletedQuiz
            ? "Continue building your path to success."
            : "Take the quiz to discover your strengths and interests."}
        </p>
      </div>

      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <div className="retro-card-yellow p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-black uppercase">COMPLETE YOUR PROFILE</h3>
              <p className="text-sm font-bold mt-1">
                Add your name, campus and grade to personalize your experience.
              </p>
              <Link href="/settings" className="retro-btn text-xs mt-3 inline-block">
                UPDATE PROFILE →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${colorClasses[action.color]} p-6 block transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]`}
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl">{action.emoji}</span>
              <span className={`retro-tag ${action.completed ? "bg-[#c8f560]" : "bg-white"}`}>
                {action.status}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-black uppercase">{action.title}</h3>
            <p className="mt-1 text-sm font-bold text-gray-700">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span> YOUR JOURNEY SO FAR
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`border-3 border-black p-4 text-center ${hasCompletedQuiz ? "bg-[#c8f560]" : ""}`}>
            <p className="text-3xl font-black">{hasCompletedQuiz ? "1" : "0"}</p>
            <p className="text-xs font-bold uppercase mt-1">Quizzes Taken</p>
          </div>
          <div className={`border-3 border-black p-4 text-center ${savedActivitiesCount > 0 ? "bg-[#6bb8ff]" : ""}`}>
            <p className="text-3xl font-black">{savedActivitiesCount}</p>
            <p className="text-xs font-bold uppercase mt-1">Activities Saved</p>
          </div>
          <div className={`border-3 border-black p-4 text-center ${connectionsCount > 0 ? "bg-[#ff8fab]" : ""}`}>
            <p className="text-3xl font-black">{connectionsCount}</p>
            <p className="text-xs font-bold uppercase mt-1">Connections Made</p>
          </div>
          <div className={`border-3 border-black p-4 text-center ${achievementsCount > 0 ? "bg-[#fff06b]" : ""}`}>
            <p className="text-3xl font-black">{achievementsCount}</p>
            <p className="text-xs font-bold uppercase mt-1">Achievements</p>
          </div>
        </div>
      </div>

      {/* Getting Started Checklist */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-xl">✅</span> GETTING STARTED
          </span>
          <span className="retro-tag bg-[#c8f560]">
            {completedCount}/{checklistItems.length}
          </span>
        </h2>
        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border-3 border-black">
              <div className={`w-6 h-6 border-3 border-black flex items-center justify-center ${
                item.completed ? "bg-[#c8f560]" : ""
              }`}>
                {item.completed ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <span className="text-xs text-gray-400">{index + 1}</span>
                )}
              </div>
              <span className={`font-bold text-sm ${item.completed ? "line-through text-gray-500" : ""}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="retro-card bg-white p-6 mb-6">
          <h2 className="font-black uppercase mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-xl">🏆</span> RECENT ACHIEVEMENTS
            </span>
            <Link href="/progress" className="text-xs retro-btn">
              VIEW ALL →
            </Link>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.slice(0, 3).map((achievement) => (
              <div key={achievement._id} className="border-3 border-black p-4 text-center bg-[#fff06b]">
                <span className="text-3xl">{achievement.emoji}</span>
                <p className="font-black uppercase text-sm mt-2">{achievement.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career Clusters Preview */}
      {careerMap && careerMap.clusters.length > 0 && (
        <div className="retro-card bg-white p-6 mb-6">
          <h2 className="font-black uppercase mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-xl">🎯</span> YOUR TOP CAREER CLUSTERS
            </span>
            <Link href="/career-map" className="text-xs retro-btn">
              FULL MAP →
            </Link>
          </h2>
          <div className="flex flex-wrap gap-3">
            {careerMap.clusters.slice(0, 3).map((cluster, index) => (
              <div
                key={cluster.name}
                className={`p-4 border-3 border-black flex items-center gap-3 ${
                  index === 0 ? "bg-[#c8f560]" : index === 1 ? "bg-[#6bb8ff]" : "bg-[#ff8fab]"
                }`}
              >
                <span className="text-2xl font-black">#{index + 1}</span>
                <span className="font-bold uppercase">{cluster.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Privacy Notice */}
      <div className="retro-card-lime p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-black uppercase">YOUR DATA IS SAFE</h3>
            <p className="text-sm font-bold mt-1">
              All your information is encrypted and stored securely. We never share your personal data outside Vinschool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
