"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function CareerMapPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const careerMap = useQuery(api.careerMap.getCareerMap);
  const quizResponses = useQuery(api.quiz.getQuizResponses);
  const hasCompletedQuiz = useQuery(api.quiz.hasCompletedQuiz);

  const generateCareerMap = useAction(api.ai.generateCareerMap);
  const saveCareerMap = useMutation(api.careerMap.saveCareerMap);

  const handleGenerate = async () => {
    if (!quizResponses?.responses) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCareerMap({
        quizResponses: quizResponses.responses,
      });

      await saveCareerMap({
        clusters: result.clusters,
        subjects: result.subjects,
        skills: result.skills,
        learningPaths: result.learningPaths,
        extracurriculars: result.extracurriculars,
      });
    } catch (err) {
      setError("Failed to generate career map. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate if quiz completed but no career map
  useEffect(() => {
    if (hasCompletedQuiz && !careerMap && quizResponses?.responses && !isGenerating) {
      handleGenerate();
    }
  }, [hasCompletedQuiz, careerMap, quizResponses]);

  // Not completed quiz
  if (hasCompletedQuiz === false) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="retro-card-yellow p-8">
          <p className="text-4xl mb-4">💡</p>
          <h1 className="text-xl font-black uppercase mb-4">COMPLETE THE QUIZ FIRST</h1>
          <p className="font-bold text-sm mb-6">
            Take the "Discover Yourself" quiz to generate your personalized career map.
          </p>
          <Link href="/discover" className="retro-btn retro-btn-lime">
            START QUIZ →
          </Link>
        </div>
      </div>
    );
  }

  // Loading or generating
  if (isGenerating || (!careerMap && hasCompletedQuiz)) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="retro-card-lime p-8">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-black uppercase mb-2">GENERATING YOUR CAREER MAP</h1>
          <p className="font-bold text-sm">
            Our AI is analyzing your responses and creating personalized recommendations...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="retro-card-pink p-8">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-black uppercase mb-4">SOMETHING WENT WRONG</h1>
          <p className="font-bold text-sm mb-6">{error}</p>
          <button onClick={handleGenerate} className="retro-btn retro-btn-yellow">
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (!careerMap) return null;

  const priorityColors: Record<string, string> = {
    high: "bg-[#c8f560]",
    medium: "bg-[#fff06b]",
    low: "bg-[#e5e5e5]",
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="retro-card-lime p-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase">PATHFINDER RESULTS</h1>
          <p className="text-sm font-bold mt-1">Your personalized career recommendations</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="retro-btn text-sm flex items-center gap-2"
        >
          🔄 REGENERATE
        </button>
      </div>

      {/* Assessment Summary */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span> ASSESSMENT SUMMARY
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quizResponses?.responses && (
            <>
              <div className="retro-card-lime p-3 text-center">
                <p className="text-2xl font-black">{(quizResponses.responses.interests as string[]).length}</p>
                <p className="text-xs font-bold uppercase">Interests</p>
              </div>
              <div className="retro-card-blue p-3 text-center">
                <p className="text-2xl font-black">{(quizResponses.responses.strengths as string[]).length}</p>
                <p className="text-xs font-bold uppercase">Strengths</p>
              </div>
              <div className="retro-card-yellow p-3 text-center">
                <p className="text-2xl font-black">{(quizResponses.responses.values as string[]).length}</p>
                <p className="text-xs font-bold uppercase">Values</p>
              </div>
              <div className="retro-card-pink p-3 text-center">
                <p className="text-2xl font-black">{(quizResponses.responses.goals as string[]).length}</p>
                <p className="text-xs font-bold uppercase">Goals</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Career Clusters */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> TOP CAREER CLUSTERS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {careerMap.clusters.map((cluster, index) => (
            <div key={index} className="border-3 border-black p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-[#6bb8ff] border-3 border-black flex items-center justify-center font-black">
                  {index + 1}
                </span>
                <h3 className="font-black text-sm uppercase">{cluster.name}</h3>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-3">{cluster.description}</p>
              <div className="bg-[#c8f560] border-3 border-black p-3">
                <p className="text-xs font-bold">
                  <span className="uppercase">Why it fits:</span> {cluster.whyItFits}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">📚</span> SUBJECTS TO FOCUS ON
        </h2>
        <div className="space-y-3">
          {careerMap.subjects.map((subject, index) => (
            <div key={index} className="border-3 border-black p-4 flex items-start gap-4">
              <span className={`retro-tag ${priorityColors[subject.priority] || priorityColors.medium}`}>
                {subject.priority}
              </span>
              <div className="flex-1">
                <h3 className="font-black text-sm uppercase">{subject.name}</h3>
                <p className="text-sm font-bold text-gray-600 mt-1">{subject.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Hard Skills */}
        <div className="retro-card bg-white p-6">
          <h2 className="font-black uppercase mb-4 flex items-center gap-2">
            <span className="text-xl">💻</span> TECHNICAL SKILLS
          </h2>
          <div className="space-y-4">
            {careerMap.skills.hard.map((skill, index) => (
              <div key={index} className="border-3 border-black p-3 bg-[#6bb8ff]/20">
                <h3 className="font-black text-sm uppercase">{skill.name}</h3>
                <p className="text-sm font-bold text-gray-600 mt-1">{skill.howToPractice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="retro-card bg-white p-6">
          <h2 className="font-black uppercase mb-4 flex items-center gap-2">
            <span className="text-xl">🤝</span> SOFT SKILLS
          </h2>
          <div className="space-y-4">
            {careerMap.skills.soft.map((skill, index) => (
              <div key={index} className="border-3 border-black p-3 bg-[#ff8fab]/20">
                <h3 className="font-black text-sm uppercase">{skill.name}</h3>
                <p className="text-sm font-bold text-gray-600 mt-1">{skill.howToPractice}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">🗺️</span> YOUR LEARNING PATH
        </h2>
        <div className="relative">
          {careerMap.learningPaths.map((step, index) => (
            <div key={index} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#fff06b] border-3 border-black flex items-center justify-center font-black">
                  {step.step}
                </div>
                {index < careerMap.learningPaths.length - 1 && (
                  <div className="w-1 h-full bg-black mt-2"></div>
                )}
              </div>
              <div className="flex-1 border-3 border-black p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-sm uppercase">{step.title}</h3>
                  <span className="retro-tag bg-[#fff06b]">{step.timeframe}</span>
                </div>
                <p className="text-sm font-bold text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extracurriculars */}
      <div className="retro-card bg-white p-6 mb-6">
        <h2 className="font-black uppercase mb-4 flex items-center gap-2">
          <span className="text-xl">🎭</span> SUGGESTED EXTRACURRICULARS
        </h2>
        <div className="flex flex-wrap gap-3">
          {careerMap.extracurriculars.map((activity, index) => (
            <span
              key={index}
              className="retro-tag bg-[#6bffec] text-sm"
            >
              {activity}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Link href="/activities" className="retro-btn retro-btn-lime">
          📋 EXPLORE ACTIVITIES
        </Link>
        <Link href="/linkup" className="retro-btn retro-btn-pink">
          🤝 FIND TEAMMATES
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 retro-card-yellow p-4">
        <p className="text-xs font-bold text-center">
          💡 This career map is a starting point for exploration, not a definitive prediction.
          Your interests and goals may evolve - that's perfectly normal! You can always retake
          the quiz or update your preferences.
        </p>
      </div>
    </div>
  );
}
