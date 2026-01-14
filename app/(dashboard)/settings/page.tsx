"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const campuses = [
  "Vinschool Central Park",
  "Vinschool Times City",
  "Vinschool Grand Park",
  "Vinschool Ocean Park",
  "Vinschool Smart City",
  "Vinschool Star City",
  "Vinschool Metropolis",
  "Other",
];

const grades = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function SettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [campus, setCampus] = useState("");
  const [grade, setGrade] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCampus(user.campus || "");
      setGrade(user.grade || "");
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        name: name || undefined,
        campus: campus || undefined,
        grade: grade || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isProfileComplete = name && campus && grade;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="retro-card-blue p-4 mb-6">
        <h1 className="text-xl font-black uppercase">SETTINGS</h1>
        <p className="text-sm font-bold mt-1">Manage your profile information</p>
      </div>

      {/* Profile Completion Status */}
      {!isProfileComplete && (
        <div className="retro-card-yellow p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-black uppercase">COMPLETE YOUR PROFILE</h3>
              <p className="text-sm font-bold mt-1">
                Fill in all fields below to unlock personalized features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="retro-card-lime p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="font-black uppercase">PROFILE UPDATED SUCCESSFULLY!</p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-6 flex items-center gap-2">
          <span className="text-xl">👤</span> PROFILE INFORMATION
        </h2>

        <div className="space-y-6">
          {/* Email (Read-only) */}
          <div>
            <label className="block font-black uppercase text-sm mb-2">EMAIL</label>
            <div className="retro-input w-full bg-gray-100 text-gray-600">
              {user?.email || "Loading..."}
            </div>
            <p className="text-xs font-bold text-gray-500 mt-1">
              Email cannot be changed (linked to Vinschool account)
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block font-black uppercase text-sm mb-2">
              DISPLAY NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="retro-input w-full"
            />
          </div>

          {/* Campus */}
          <div>
            <label className="block font-black uppercase text-sm mb-2">
              CAMPUS <span className="text-red-500">*</span>
            </label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="retro-input w-full"
            >
              <option value="">Select your campus</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block font-black uppercase text-sm mb-2">
              GRADE <span className="text-red-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="retro-input w-full"
            >
              <option value="">Select your grade</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="retro-btn retro-btn-lime w-full flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                SAVING...
              </>
            ) : (
              <>💾 SAVE CHANGES</>
            )}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">🔐</span> ACCOUNT INFO
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center border-3 border-black p-3">
            <span className="font-bold text-sm">ROLE</span>
            <span className="retro-tag bg-[#c8f560]">
              {user?.role?.toUpperCase() || "STUDENT"}
            </span>
          </div>
          <div className="flex justify-between items-center border-3 border-black p-3">
            <span className="font-bold text-sm">PROFILE STATUS</span>
            <span className={`retro-tag ${isProfileComplete ? "bg-[#c8f560]" : "bg-[#fff06b]"}`}>
              {isProfileComplete ? "COMPLETE" : "INCOMPLETE"}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="retro-card-lime p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-black uppercase">DATA PRIVACY</h3>
            <p className="text-sm font-bold mt-1">
              Your information is encrypted and only visible to you and Vinschool counselors.
              We never share your data outside the school.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
