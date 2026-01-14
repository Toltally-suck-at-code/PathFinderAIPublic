"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

const quizSteps = [
  {
    id: "interests",
    title: "What subjects or activities do you enjoy most?",
    description: "Select all that apply",
    type: "multi-select",
    options: [
      "Mathematics & Logic",
      "Science & Experiments",
      "Literature & Writing",
      "History & Social Studies",
      "Art & Design",
      "Music & Performance",
      "Technology & Coding",
      "Sports & Physical Activities",
      "Business & Economics",
      "Languages & Communication",
      "Environmental Studies",
      "Psychology & Human Behavior",
    ],
  },
  {
    id: "strengths",
    title: "What are your strongest abilities?",
    description: "Select your top 3-5 strengths",
    type: "multi-select",
    options: [
      "Analytical thinking",
      "Creative problem-solving",
      "Communication & presentation",
      "Leadership & organizing",
      "Attention to detail",
      "Working with hands",
      "Understanding people",
      "Learning quickly",
      "Staying calm under pressure",
      "Thinking outside the box",
      "Collaborating with others",
      "Working independently",
    ],
  },
  {
    id: "teamPreference",
    title: "When working on a project, you prefer to...",
    description: "Choose the option that best describes you",
    type: "single-select",
    options: [
      { value: "solo", label: "Plan & assign tasks" },
      { value: "small-team", label: "Inspire ideas" },
      { value: "large-team", label: "Support others quietly" },
      { value: "mixed", label: "Execute final ideas" },
    ],
  },
  {
    id: "planningStyle",
    title: "How would you describe your working style?",
    description: "Choose the option that best describes you",
    type: "single-select",
    options: [
      { value: "planner", label: "Organized & methodical" },
      { value: "flexible", label: "Flexible & adaptive" },
      { value: "mixed", label: "Creative & spontaneous" },
      { value: "deadline", label: "Fast-paced & energetic" },
    ],
  },
  {
    id: "values",
    title: "What matters most to you in a future career?",
    description: "Select your top 3 values",
    type: "multi-select",
    options: [
      "Making a positive impact",
      "Financial stability",
      "Creative freedom",
      "Continuous learning",
      "Work-life balance",
      "Leadership opportunities",
      "Helping others directly",
      "Recognition and prestige",
      "Innovation and cutting-edge work",
      "Job security",
      "Travel and new experiences",
      "Flexibility and autonomy",
    ],
  },
  {
    id: "goals",
    title: "What are your long-term aspirations?",
    description: "Select all that resonate with you",
    type: "multi-select",
    options: [
      "Start my own business",
      "Become an expert in my field",
      "Lead teams or organizations",
      "Create art or content",
      "Solve global problems",
      "Help my local community",
      "Achieve financial independence",
      "Balance career with family life",
      "Continuously learn and grow",
      "Travel and work internationally",
      "Make scientific discoveries",
      "Teach and mentor others",
    ],
  },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({
    interests: [],
    strengths: [],
    teamPreference: "",
    planningStyle: "",
    values: [],
    goals: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const saveQuizResponses = useMutation(api.quiz.saveQuizResponses);
  const chatWithAI = useAction(api.ai.chatWithAI);
  const existingResponses = useQuery(api.quiz.getQuizResponses);
  const currentUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (existingResponses?.responses) {
      setResponses({
        interests: existingResponses.responses.interests,
        strengths: existingResponses.responses.strengths,
        teamPreference: existingResponses.responses.workingStyle.teamPreference,
        planningStyle: existingResponses.responses.workingStyle.planningStyle,
        values: existingResponses.responses.values,
        goals: existingResponses.responses.goals,
      });
    }
  }, [existingResponses]);

  const currentQuestion = quizSteps[currentStep];
  const progress = ((currentStep + 1) / quizSteps.length) * 100;

  const handleMultiSelect = (option: string) => {
    const current = responses[currentQuestion.id] as string[];
    if (current.includes(option)) {
      setResponses({
        ...responses,
        [currentQuestion.id]: current.filter((o) => o !== option),
      });
    } else {
      setResponses({
        ...responses,
        [currentQuestion.id]: [...current, option],
      });
    }
  };

  const handleSingleSelect = (value: string) => {
    setResponses({
      ...responses,
      [currentQuestion.id]: value,
    });
  };

  const canProceed = () => {
    const current = responses[currentQuestion.id];
    if (currentQuestion.type === "multi-select") {
      return (current as string[]).length > 0;
    }
    return current !== "";
  };

  const handleNext = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveQuizResponses({
        responses: {
          interests: responses.interests as string[],
          strengths: responses.strengths as string[],
          workingStyle: {
            teamPreference: responses.teamPreference as string,
            planningStyle: responses.planningStyle as string,
          },
          values: responses.values as string[],
          goals: responses.goals as string[],
        },
      });
      router.push("/career-map");
    } catch (error) {
      console.error("Failed to save quiz responses:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !currentUser?._id) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages([...chatMessages, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await chatWithAI({
        userId: currentUser._id,
        sessionId: `quiz-${currentUser._id}`,
        message: userMessage,
        quizContext: {
          currentStep: currentQuestion.id,
          currentResponses: responses,
        },
      });
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your message. Please try again!" },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Main Quiz Area */}
      <div className="flex-1 max-w-3xl">
        {/* Header */}
        <div className="retro-card-lime p-4 mb-6">
          <h1 className="text-xl font-black uppercase">PATHFINDER QUIZ</h1>
          <p className="text-sm font-bold mt-1">Discover your strengths and interests</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span>QUESTION {currentStep + 1}</span>
            <span>{Math.round(progress)}% COMPLETED</span>
          </div>
          <div className="retro-progress">
            <div className="retro-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="retro-card bg-white p-6 mb-6">
          <h2 className="text-lg font-black uppercase mb-2">{currentQuestion.title}</h2>
          <p className="text-sm font-bold text-gray-600 mb-6">{currentQuestion.description}</p>

          {/* Options Grid */}
          {currentQuestion.type === "multi-select" ? (
            <div className="grid grid-cols-2 gap-3">
              {(currentQuestion.options as string[]).map((option) => {
                const isSelected = (responses[currentQuestion.id] as string[]).includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleMultiSelect(option)}
                    className={`p-4 text-left font-bold text-sm uppercase transition-all border-3 border-black ${
                      isSelected
                        ? "bg-[#c8f560] shadow-[4px_4px_0_0_#000]"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 border-3 border-black flex items-center justify-center ${
                          isSelected ? "bg-black" : "bg-white"
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(currentQuestion.options as Array<{ value: string; label: string }>).map((option) => {
                const isSelected = responses[currentQuestion.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSingleSelect(option.value)}
                    className={`p-4 text-center font-bold text-sm uppercase transition-all border-3 border-black ${
                      isSelected
                        ? "bg-[#6bb8ff] shadow-[4px_4px_0_0_#000]"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="retro-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← BACK
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="retro-btn retro-btn-yellow lg:hidden"
          >
            💬 NEED HELP?
          </button>

          {currentStep < quizSteps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="retro-btn retro-btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NEXT →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="retro-btn retro-btn-pink disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                "VIEW RESULTS →"
              )}
            </button>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 retro-card-yellow p-4">
          <p className="text-xs font-bold text-center">
            🔒 Your responses are encrypted and used only to generate personalized recommendations.
          </p>
        </div>
      </div>

      {/* Chat Sidebar - Desktop */}
      <div className="hidden lg:block w-80">
        <div className="retro-card-lime p-4 mb-4">
          <h2 className="font-black uppercase">💬 CHAT WITH PATHFINDER</h2>
        </div>

        <div className="retro-card bg-white overflow-hidden">
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-4">🤖</p>
                <p className="font-bold text-sm">Hi! I'm here to help you understand yourself better.</p>
                <p className="text-xs text-gray-600 mt-2">Ask me anything about the quiz!</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3 border-3 border-black text-sm font-bold ${
                    msg.role === "user" ? "bg-[#6bb8ff]" : "bg-[#c8f560]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#c8f560] p-3 border-3 border-black">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-3 border-black p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Type a message..."
                className="retro-input flex-1 text-sm"
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim() || isChatLoading || !currentUser?._id}
                className="retro-btn retro-btn-pink px-4 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chat Panel */}
      {showChat && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-white border-t-4 border-black">
            <div className="bg-[#c8f560] border-b-4 border-black px-4 py-3 flex items-center justify-between">
              <span className="font-black uppercase">💬 CHAT WITH PATHFINDER</span>
              <button onClick={() => setShowChat(false)} className="font-black text-xl">✕</button>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-4">
                  <p className="font-bold text-sm">Ask me anything about the quiz!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 border-3 border-black text-sm font-bold ${
                      msg.role === "user" ? "bg-[#6bb8ff]" : "bg-[#c8f560]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-3 border-black p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Type a message..."
                  className="retro-input flex-1 text-sm"
                />
                <button
                  onClick={handleChat}
                  disabled={!chatInput.trim() || isChatLoading || !currentUser?._id}
                  className="retro-btn retro-btn-pink px-4 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
