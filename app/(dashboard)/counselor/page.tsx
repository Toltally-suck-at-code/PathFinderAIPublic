"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CounselorDashboardPage() {
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"students" | "trends" | "activities">("students");

  // Fetch counselor data
  const user = useQuery(api.users.getCurrentUser);
  const studentSummaries = useQuery(api.counselor.getStudentSummaries, {
    campus: selectedCampus || undefined,
    grade: selectedGrade || undefined,
  });
  const interestTrends = useQuery(api.counselor.getInterestTrends, {
    campus: selectedCampus || undefined,
  });
  const careerDistribution = useQuery(api.counselor.getCareerClusterDistribution, {
    campus: selectedCampus || undefined,
  });
  const activityProgress = useQuery(api.counselor.getActivityProgressOverview, {});
  const exportData = useQuery(api.counselor.exportStudentData, {
    campus: selectedCampus || undefined,
    grade: selectedGrade || undefined,
  });

  const campuses = [
    "Vinschool Central Park",
    "Vinschool Times City",
    "Vinschool Grand Park",
    "Vinschool Ocean Park",
    "Vinschool Smart City",
    "Vinschool Star City",
    "Vinschool Metropolis",
  ];

  const grades = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  // Check if user is counselor
  if (user && user.role !== "counselor" && user.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="retro-card bg-white text-center py-12">
          <p className="text-4xl mb-4">🔒</p>
          <p className="font-bold uppercase mb-2">COUNSELOR ACCESS ONLY</p>
          <p className="text-sm font-bold text-gray-600">
            This page is restricted to school counselors.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (studentSummaries === undefined) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="retro-card bg-white p-8 text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold">LOADING DASHBOARD...</p>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!exportData) return;

    const headers = [
      "Name",
      "Email",
      "Campus",
      "Grade",
      "Quiz Completed",
      "Career Map Generated",
      "Top Career Cluster 1",
      "Top Career Cluster 2",
      "Top Career Cluster 3",
      "Interests",
      "Strengths",
      "Saved Activities",
      "Completed Activities",
      "Achievements",
    ];

    const rows = exportData.map((student) => [
      student.name,
      student.email,
      student.campus,
      student.grade,
      student.quizCompleted,
      student.careerMapGenerated,
      student.topCareerCluster1,
      student.topCareerCluster2,
      student.topCareerCluster3,
      student.interests,
      student.strengths,
      student.savedActivities,
      student.completedActivities,
      student.achievements,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pathfinder-students-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate stats
  const totalStudents = studentSummaries?.length || 0;
  const quizCompleted = studentSummaries?.filter((s) => s.hasCompletedQuiz).length || 0;
  const careerMapsGenerated = studentSummaries?.filter((s) => s.hasCareerMap).length || 0;
  const activeStudents = studentSummaries?.filter((s) => s.savedActivitiesCount > 0).length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="retro-card-blue p-4 mb-6">
        <h1 className="text-xl font-black uppercase">COUNSELOR DASHBOARD</h1>
        <p className="text-sm font-bold mt-1">Monitor student progress and engagement</p>
      </div>

      {/* Filters */}
      <div className="retro-card bg-white p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block font-black uppercase text-xs mb-2">CAMPUS</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="retro-input w-full"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block font-black uppercase text-xs mb-2">GRADE</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="retro-input w-full"
            >
              <option value="">All Grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleExportCSV} className="retro-btn retro-btn-lime">
              📥 EXPORT CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="retro-card bg-white p-4 text-center">
          <p className="text-3xl font-black">{totalStudents}</p>
          <p className="text-xs font-bold uppercase text-gray-600">TOTAL STUDENTS</p>
        </div>
        <div className="retro-card-lime p-4 text-center">
          <p className="text-3xl font-black">{quizCompleted}</p>
          <p className="text-xs font-bold uppercase">QUIZ COMPLETED</p>
        </div>
        <div className="retro-card-blue p-4 text-center">
          <p className="text-3xl font-black">{careerMapsGenerated}</p>
          <p className="text-xs font-bold uppercase">CAREER MAPS</p>
        </div>
        <div className="retro-card-yellow p-4 text-center">
          <p className="text-3xl font-black">{activeStudents}</p>
          <p className="text-xs font-bold uppercase">ACTIVE LEARNERS</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("students")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "students" ? "retro-btn-lime" : ""}`}
        >
          📋 STUDENT LIST
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "trends" ? "retro-btn-lime" : ""}`}
        >
          📊 INTEREST TRENDS
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`retro-btn text-xs py-2 px-3 ${activeTab === "activities" ? "retro-btn-lime" : ""}`}
        >
          🎯 ACTIVITY ENGAGEMENT
        </button>
      </div>

      {/* Student List Tab */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {studentSummaries && studentSummaries.length > 0 ? (
            studentSummaries.map((student) => (
              <div key={student.id} className="retro-card bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#6bb8ff] border-3 border-black flex items-center justify-center">
                      <span className="text-lg font-black">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-black uppercase">{student.name}</h3>
                      <p className="text-xs font-bold text-gray-600">
                        {student.grade} • {student.campus}
                      </p>
                      <p className="text-xs font-bold text-gray-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`retro-tag ${student.profileComplete ? "bg-[#c8f560]" : "bg-gray-200"}`}
                    >
                      PROFILE {student.profileComplete ? "✓" : "✗"}
                    </span>
                    <span
                      className={`retro-tag ${student.hasCompletedQuiz ? "bg-[#c8f560]" : "bg-gray-200"}`}
                    >
                      QUIZ {student.hasCompletedQuiz ? "✓" : "✗"}
                    </span>
                    <span
                      className={`retro-tag ${student.hasCareerMap ? "bg-[#c8f560]" : "bg-gray-200"}`}
                    >
                      CAREER MAP {student.hasCareerMap ? "✓" : "✗"}
                    </span>
                  </div>
                </div>

                {/* Student Details */}
                <div className="mt-4 pt-4 border-t-3 border-black grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xl font-black">{student.savedActivitiesCount}</p>
                    <p className="text-xs font-bold text-gray-600">SAVED</p>
                  </div>
                  <div>
                    <p className="text-xl font-black">{student.completedActivitiesCount}</p>
                    <p className="text-xs font-bold text-gray-600">COMPLETED</p>
                  </div>
                  <div>
                    <p className="text-xl font-black">{student.achievementsCount}</p>
                    <p className="text-xs font-bold text-gray-600">ACHIEVEMENTS</p>
                  </div>
                  <div>
                    <p className="text-xl font-black">{student.reflectionsCount}</p>
                    <p className="text-xs font-bold text-gray-600">REFLECTIONS</p>
                  </div>
                </div>

                {/* Career Clusters & Interests */}
                {(student.topCareerClusters.length > 0 || student.interests.length > 0) && (
                  <div className="mt-4 pt-4 border-t-3 border-black">
                    {student.topCareerClusters.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-black uppercase mb-2">TOP CAREER CLUSTERS</p>
                        <div className="flex flex-wrap gap-2">
                          {student.topCareerClusters.map((cluster) => (
                            <span key={cluster} className="retro-tag bg-[#6bb8ff]">
                              {cluster}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {student.interests.length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase mb-2">INTERESTS</p>
                        <div className="flex flex-wrap gap-2">
                          {student.interests.map((interest) => (
                            <span key={interest} className="retro-tag bg-[#fff06b]">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">📋</p>
              <p className="font-bold uppercase">NO STUDENTS FOUND</p>
              <p className="text-sm font-bold text-gray-600 mt-2">
                Try adjusting the filters above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interest Trends Tab */}
      {activeTab === "trends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Interests */}
          <div className="retro-card bg-white p-6">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2">
              <span>💡</span> TOP INTERESTS
            </h3>
            {interestTrends?.topInterests && interestTrends.topInterests.length > 0 ? (
              <div className="space-y-3">
                {interestTrends.topInterests.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="font-black w-6">{index + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-sm">{item.name}</span>
                        <span className="text-xs font-bold text-gray-600">{item.count} students</span>
                      </div>
                      <div className="retro-progress h-2">
                        <div
                          className="retro-progress-bar"
                          style={{
                            width: `${(item.count / (interestTrends.totalStudents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-600">No data available</p>
            )}
          </div>

          {/* Top Strengths */}
          <div className="retro-card bg-white p-6">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2">
              <span>💪</span> TOP STRENGTHS
            </h3>
            {interestTrends?.topStrengths && interestTrends.topStrengths.length > 0 ? (
              <div className="space-y-3">
                {interestTrends.topStrengths.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="font-black w-6">{index + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-sm">{item.name}</span>
                        <span className="text-xs font-bold text-gray-600">{item.count} students</span>
                      </div>
                      <div className="retro-progress h-2">
                        <div
                          className="retro-progress-bar bg-[#6bb8ff]"
                          style={{
                            width: `${(item.count / (interestTrends.totalStudents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-600">No data available</p>
            )}
          </div>

          {/* Career Cluster Distribution */}
          <div className="retro-card bg-white p-6 md:col-span-2">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2">
              <span>🎯</span> CAREER CLUSTER DISTRIBUTION
            </h3>
            {careerDistribution && careerDistribution.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {careerDistribution.map((cluster, index) => (
                  <div
                    key={cluster.name}
                    className={`p-3 border-3 border-black ${
                      index === 0
                        ? "bg-[#c8f560]"
                        : index === 1
                        ? "bg-[#6bb8ff]"
                        : index === 2
                        ? "bg-[#ff8fab]"
                        : "bg-[#fff06b]"
                    }`}
                  >
                    <p className="font-black uppercase text-sm">{cluster.name}</p>
                    <p className="text-xs font-bold">{cluster.count} points</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-600">No data available</p>
            )}
          </div>

          {/* Top Values */}
          <div className="retro-card bg-white p-6">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2">
              <span>❤️</span> TOP VALUES
            </h3>
            {interestTrends?.topValues && interestTrends.topValues.length > 0 ? (
              <div className="space-y-3">
                {interestTrends.topValues.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="font-black w-6">{index + 1}.</span>
                    <span className="font-bold text-sm flex-1">{item.name}</span>
                    <span className="retro-tag bg-[#ff8fab]">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-600">No data available</p>
            )}
          </div>

          {/* Top Goals */}
          <div className="retro-card bg-white p-6">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2">
              <span>🎯</span> TOP GOALS
            </h3>
            {interestTrends?.topGoals && interestTrends.topGoals.length > 0 ? (
              <div className="space-y-3">
                {interestTrends.topGoals.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="font-black w-6">{index + 1}.</span>
                    <span className="font-bold text-sm flex-1">{item.name}</span>
                    <span className="retro-tag bg-[#6bb8ff]">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-600">No data available</p>
            )}
          </div>
        </div>
      )}

      {/* Activity Engagement Tab */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          {activityProgress && activityProgress.length > 0 ? (
            activityProgress.map((activity) => (
              <div key={activity.title} className="retro-card bg-white p-5">
                <h3 className="font-black uppercase mb-4">{activity.title}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-100 border-3 border-black">
                    <p className="text-2xl font-black">{activity.saved}</p>
                    <p className="text-xs font-bold uppercase">SAVED</p>
                  </div>
                  <div className="p-3 bg-[#6bb8ff] border-3 border-black">
                    <p className="text-2xl font-black">{activity.inProgress}</p>
                    <p className="text-xs font-bold uppercase">IN PROGRESS</p>
                  </div>
                  <div className="p-3 bg-[#c8f560] border-3 border-black">
                    <p className="text-2xl font-black">{activity.completed}</p>
                    <p className="text-xs font-bold uppercase">COMPLETED</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="retro-progress h-4">
                    <div
                      className="retro-progress-bar"
                      style={{
                        width: `${
                          ((activity.completed + activity.inProgress) /
                            (activity.saved + activity.inProgress + activity.completed || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-600 mt-2 text-right">
                    {Math.round(
                      ((activity.completed + activity.inProgress) /
                        (activity.saved + activity.inProgress + activity.completed || 1)) *
                        100
                    )}
                    % engagement rate
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">🎯</p>
              <p className="font-bold uppercase">NO ACTIVITY DATA YET</p>
              <p className="text-sm font-bold text-gray-600 mt-2">
                Students haven't started saving activities yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Data Summary */}
      <div className="mt-8 retro-card-lime p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="font-black uppercase">DATA INSIGHTS</h3>
            <p className="text-sm font-bold mt-1">
              {quizCompleted > 0
                ? `${Math.round((quizCompleted / totalStudents) * 100)}% of students have completed the discovery quiz. `
                : "No students have completed the quiz yet. "}
              {careerMapsGenerated > 0
                ? `${Math.round((careerMapsGenerated / totalStudents) * 100)}% have generated career maps.`
                : "Encourage students to explore their interests!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
