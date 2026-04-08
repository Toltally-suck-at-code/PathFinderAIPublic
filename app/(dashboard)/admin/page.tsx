"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "activities" | "audit">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const user = useQuery(api.users.getCurrentUser);
  const systemStats = useQuery(api.admin.getSystemStats);
  const allUsers = useQuery(api.admin.getAllUsers, {
    role: roleFilter,
    search: searchQuery,
  });
  const activitiesOverview = useQuery(api.admin.getActivitiesOverview);
  const recentActivity = useQuery(api.admin.getRecentActivity, { limit: 20 });

  const updateUserRole = useMutation(api.admin.updateUserRole);

  // Check if user is admin
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="retro-card bg-white text-center py-12">
          <p className="text-4xl mb-4">🔒</p>
          <p className="font-bold uppercase mb-2">ADMIN ACCESS ONLY</p>
          <p className="text-sm font-bold text-gray-600">
            This page is restricted to system administrators.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (systemStats === undefined) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="retro-card bg-white p-8 text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold">LOADING ADMIN DASHBOARD...</p>
        </div>
      </div>
    );
  }

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUser) return;
    try {
      await updateUserRole({
        userId: selectedUser._id as Id<"users">,
        role: newRole as "student" | "counselor" | "partner" | "admin",
      });
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz_completed": return "📝";
      case "career_map_generated": return "🗺️";
      case "intro_request": return "🤝";
      case "achievement": return "🏆";
      default: return "📌";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="retro-card bg-black text-white p-4 mb-6">
        <h1 className="text-xl font-black uppercase">ADMIN DASHBOARD</h1>
        <p className="text-sm font-bold mt-1 opacity-80">System Management & Analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="retro-card bg-white p-4 text-center">
          <p className="text-3xl font-black">{systemStats?.totalUsers || 0}</p>
          <p className="text-xs font-bold uppercase text-gray-600">TOTAL USERS</p>
          <p className="text-xs text-lime-600 font-bold mt-1">+{systemStats?.newToday || 0} today</p>
        </div>
        <div className="retro-card-lime p-4 text-center">
          <p className="text-3xl font-black">{systemStats?.quizCompleted || 0}</p>
          <p className="text-xs font-bold uppercase">QUIZZES TAKEN</p>
          <p className="text-xs font-bold mt-1">
            {systemStats?.totalUsers ? Math.round((systemStats.quizCompleted / systemStats.totalUsers) * 100) : 0}%
          </p>
        </div>
        <div className="retro-card-blue p-4 text-center">
          <p className="text-3xl font-black">{systemStats?.careerMapsGenerated || 0}</p>
          <p className="text-xs font-bold uppercase">CAREER MAPS</p>
          <p className="text-xs font-bold mt-1">{systemStats?.totalConnections || 0} connections</p>
        </div>
        <div className="retro-card-yellow p-4 text-center">
          <p className="text-3xl font-black">{systemStats?.pendingRequests || 0}</p>
          <p className="text-xs font-bold uppercase">PENDING REQUESTS</p>
          <p className="text-xs font-bold mt-1">{systemStats?.totalSavedActivities || 0} activities</p>
        </div>
      </div>

      {/* Growth Stats */}
      <div className="retro-card bg-white p-4 mb-6">
        <h2 className="font-black uppercase text-sm mb-3">USER GROWTH</h2>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#c8f560]">{systemStats?.newToday || 0}</span>
            <span className="text-xs font-bold uppercase text-gray-600">TODAY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#6bb8ff]">{systemStats?.newThisWeek || 0}</span>
            <span className="text-xs font-bold uppercase text-gray-600">THIS WEEK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#ff8fab]">{systemStats?.newThisMonth || 0}</span>
            <span className="text-xs font-bold uppercase text-gray-600">THIS MONTH</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "overview" ? "retro-btn-lime" : ""}`}
        >
          📊 OVERVIEW
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "users" ? "retro-btn-lime" : ""}`}
        >
          👥 USERS
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "activities" ? "retro-btn-lime" : ""}`}
        >
          📋 ACTIVITIES
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "audit" ? "retro-btn-lime" : ""}`}
        >
          📜 AUDIT LOG
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Career Clusters */}
          <div className="retro-card bg-white p-6">
            <h2 className="font-black uppercase mb-4">SYSTEM HEALTH</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-3 border-black p-4 bg-[#c8f560]">
                <p className="text-2xl font-black">{systemStats?.totalUsers || 0}</p>
                <p className="text-xs font-bold uppercase">REGISTERED USERS</p>
              </div>
              <div className="border-3 border-black p-4 bg-[#6bb8ff]">
                <p className="text-2xl font-black">
                  {systemStats?.totalUsers ? Math.round((systemStats.quizCompleted / systemStats.totalUsers) * 100) : 0}%
                </p>
                <p className="text-xs font-bold uppercase">ENGAGEMENT RATE</p>
              </div>
              <div className="border-3 border-black p-4 bg-[#fff06b]">
                <p className="text-2xl font-black">{systemStats?.totalConnections || 0}</p>
                <p className="text-xs font-bold uppercase">LINKUP CONNECTIONS</p>
              </div>
              <div className="border-3 border-black p-4 bg-[#ff8fab]">
                <p className="text-2xl font-black">{systemStats?.pendingRequests || 0}</p>
                <p className="text-xs font-bold uppercase">PENDING REQUESTS</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="retro-card bg-white p-6">
            <h2 className="font-black uppercase mb-4">QUICK ACTIONS</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("users")}
                className="retro-btn retro-btn-blue text-xs"
              >
                👥 MANAGE USERS
              </button>
              <button
                onClick={() => setActiveTab("activities")}
                className="retro-btn retro-btn-yellow text-xs"
              >
                📋 VIEW ACTIVITIES
              </button>
              <a href="/counselor" className="retro-btn text-xs">
                📊 COUNSELOR VIEW
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="retro-card bg-white p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block font-black uppercase text-xs mb-2">SEARCH</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="retro-input w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-48">
                <label className="block font-black uppercase text-xs mb-2">ROLE</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="retro-input w-full"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="counselor">Counselors</option>
                  <option value="partner">Partners</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {allUsers && allUsers.length > 0 ? (
            <div className="space-y-3">
              {allUsers.map((user) => (
                <div key={user._id} className="retro-card bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#6bb8ff] border-3 border-black flex items-center justify-center">
                        <span className="text-lg font-black">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-black uppercase">{user.name}</h3>
                        <p className="text-xs font-bold text-gray-600">{user.email}</p>
                        <p className="text-xs font-bold text-gray-400">
                          {user.grade} • {user.campus}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`retro-tag ${
                        user.role === "admin" ? "bg-black text-white" :
                        user.role === "counselor" ? "bg-[#6bb8ff]" :
                        user.role === "partner" ? "bg-[#fff06b]" :
                        "bg-gray-200"
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="retro-btn text-xs"
                      >
                        CHANGE ROLE
                      </button>
                    </div>
                  </div>

                  {/* Status Grid */}
                  <div className="mt-4 pt-4 border-t-3 border-black grid grid-cols-4 gap-2 text-center">
                    <div className={`p-2 border-2 border-black ${user.hasCompletedQuiz ? "bg-[#c8f560]" : "bg-gray-100"}`}>
                      <p className="font-black text-sm">{user.hasCompletedQuiz ? "✓" : "✗"}</p>
                      <p className="text-xs font-bold uppercase">QUIZ</p>
                    </div>
                    <div className={`p-2 border-2 border-black ${user.hasCareerMap ? "bg-[#c8f560]" : "bg-gray-100"}`}>
                      <p className="font-black text-sm">{user.hasCareerMap ? "✓" : "✗"}</p>
                      <p className="text-xs font-bold uppercase">MAP</p>
                    </div>
                    <div className={`p-2 border-2 border-black ${user.savedActivitiesCount > 0 ? "bg-[#6bb8ff]" : "bg-gray-100"}`}>
                      <p className="font-black text-sm">{user.savedActivitiesCount}</p>
                      <p className="text-xs font-bold uppercase">SAVED</p>
                    </div>
                    <div className={`p-2 border-2 border-black ${user.achievementsCount > 0 ? "bg-[#fff06b]" : "bg-gray-100"}`}>
                      <p className="font-black text-sm">{user.achievementsCount}</p>
                      <p className="text-xs font-bold uppercase">ACHIEVEMENTS</p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-gray-400 mt-3">
                    Joined: {formatDate(user.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">👥</p>
              <p className="font-bold uppercase">NO USERS FOUND</p>
              <p className="text-sm font-bold text-gray-600 mt-2">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          {activitiesOverview && activitiesOverview.length > 0 ? (
            activitiesOverview.map((activity) => (
              <div key={activity._id} className="retro-card bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black uppercase">{activity.title}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className={`retro-tag ${activity.source === "partner" ? "bg-[#6bb8ff]" : "bg-[#c8f560]"}`}>
                        {activity.source.toUpperCase()}
                      </span>
                      <span className="retro-tag bg-gray-200">
                        {activity.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{activity.savedCount}</p>
                    <p className="text-xs font-bold uppercase text-gray-600">SAVED</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="border-2 border-black p-2 text-center bg-gray-100">
                    <p className="font-black">{activity.savedCount}</p>
                    <p className="text-xs font-bold uppercase">SAVED</p>
                  </div>
                  <div className="border-2 border-black p-2 text-center bg-[#6bb8ff]">
                    <p className="font-black">{activity.completedCount}</p>
                    <p className="text-xs font-bold uppercase">COMPLETED</p>
                  </div>
                  <div className="border-2 border-black p-2 text-center bg-[#c8f560]">
                    <p className="font-black">{activity.engagementRate}%</p>
                    <p className="text-xs font-bold uppercase">ENGAGEMENT</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">📋</p>
              <p className="font-bold uppercase">NO ACTIVITIES YET</p>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <div className="retro-card bg-white p-6">
          <h2 className="font-black uppercase mb-4">RECENT ACTIVITY</h2>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border-2 border-black">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{activity.details}</p>
                    <p className="text-xs text-gray-500">User ID: {activity.userId}</p>
                  </div>
                  <span className="retro-tag bg-gray-100">{formatDate(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          )}
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="retro-card bg-white p-6 max-w-md w-full">
            <h2 className="font-black uppercase mb-2">CHANGE ROLE</h2>
            <p className="text-sm font-bold text-gray-600 mb-4">
              Update role for: <span className="text-black">{selectedUser.name}</span>
            </p>
            <div className="space-y-2 mb-6">
              {["student", "counselor", "partner", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => handleUpdateRole(role)}
                  className={`w-full p-3 text-left font-bold uppercase border-3 border-black transition-all ${
                    selectedUser.role === role
                      ? "bg-[#c8f560]"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
              }}
              className="retro-btn w-full"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}