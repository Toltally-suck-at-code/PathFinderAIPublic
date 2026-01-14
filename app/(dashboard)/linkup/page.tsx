"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function LinkUpPage() {
  const [matchMode, setMatchMode] = useState<"similar" | "complementary">("similar");
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [introMessage, setIntroMessage] = useState("");
  const [lookingForText, setLookingForText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showRequestsTab, setShowRequestsTab] = useState<"matches" | "sent" | "received">("matches");

  // Fetch data from database
  const matches = useQuery(api.linkup.getMatches, { mode: matchMode });
  const linkupProfile = useQuery(api.linkup.getLinkupProfile, {});
  const sentRequests = useQuery(api.linkup.getSentIntroRequests, {});
  const receivedRequests = useQuery(api.linkup.getReceivedIntroRequests, {});
  const connectionCount = useQuery(api.linkup.getConnectionCount, {});
  const quizResponse = useQuery(api.quiz.getQuizResponse, {});
  const teammateRequests = useQuery(api.linkup.getTeammateRequests, {});

  // Mutations
  const saveProfile = useMutation(api.linkup.saveOrUpdateProfile);
  const createIntroRequest = useMutation(api.linkup.createIntroRequest);
  const respondToRequest = useMutation(api.linkup.respondToIntroRequest);
  const checkAchievements = useMutation(api.achievements.checkAndAwardAchievements);

  // Initialize lookingForText from profile
  useState(() => {
    if (linkupProfile?.lookingFor) {
      setLookingForText(linkupProfile.lookingFor);
    }
  });

  const handleRequestIntro = (match: any) => {
    setSelectedMatch(match);
    setShowIntroModal(true);
  };

  const handleSendIntroRequest = async () => {
    if (!selectedMatch || !introMessage.trim()) return;
    setIsSending(true);
    try {
      await createIntroRequest({
        toUserId: selectedMatch.id,
        message: introMessage,
      });
      await checkAchievements({});
      setShowIntroModal(false);
      setIntroMessage("");
      setSelectedMatch(null);
    } catch (error: any) {
      alert(error.message || "Failed to send request");
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!lookingForText.trim()) return;
    setIsSavingProfile(true);
    try {
      await saveProfile({ lookingFor: lookingForText });
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRespondToRequest = async (requestId: Id<"introRequests">, accept: boolean) => {
    try {
      await respondToRequest({ requestId, accept });
      if (accept) {
        await checkAchievements({});
      }
    } catch (error) {
      console.error("Failed to respond to request:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-[#c8f560]";
    if (score >= 70) return "bg-[#fff06b]";
    return "bg-[#6bb8ff]";
  };

  const pendingReceivedCount = receivedRequests?.filter(r => r.status === "pending").length || 0;

  // Check if user has completed the quiz
  if (quizResponse === null) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="retro-card-pink p-4 mb-6">
          <h1 className="text-xl font-black uppercase">LINKUP</h1>
          <p className="text-sm font-bold mt-1">Find teammates with matching strengths</p>
        </div>
        <div className="retro-card bg-white text-center py-12">
          <p className="text-4xl mb-4">🎯</p>
          <p className="font-bold uppercase mb-2">COMPLETE THE QUIZ FIRST</p>
          <p className="text-sm font-bold text-gray-600 mb-4">
            We need to know your interests and strengths to find matches for you.
          </p>
          <a href="/quiz" className="retro-btn retro-btn-lime text-sm inline-block">
            START QUIZ →
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  if (matches === undefined) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="retro-card bg-white p-8 text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold">FINDING MATCHES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="retro-card-pink p-4 mb-6">
        <h1 className="text-xl font-black uppercase">LINKUP</h1>
        <p className="text-sm font-bold mt-1">Find teammates with matching strengths</p>
      </div>

      {/* Connection Stats */}
      {(connectionCount !== undefined && connectionCount > 0) && (
        <div className="retro-card-lime p-4 mb-6 flex items-center justify-between">
          <p className="font-bold text-sm">
            <span className="text-lg">{connectionCount}</span> CONNECTIONS MADE
          </p>
          <span className="text-xl">🤝</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowRequestsTab("matches")}
          className={`retro-btn text-xs py-2 px-3 flex items-center gap-2 ${
            showRequestsTab === "matches" ? "retro-btn-lime" : ""
          }`}
        >
          <span>🎯</span> MATCHES
        </button>
        <button
          onClick={() => setShowRequestsTab("sent")}
          className={`retro-btn text-xs py-2 px-3 flex items-center gap-2 ${
            showRequestsTab === "sent" ? "retro-btn-lime" : ""
          }`}
        >
          <span>📤</span> SENT
          {sentRequests && sentRequests.length > 0 && (
            <span className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs">
              {sentRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowRequestsTab("received")}
          className={`retro-btn text-xs py-2 px-3 flex items-center gap-2 ${
            showRequestsTab === "received" ? "retro-btn-lime" : ""
          }`}
        >
          <span>📥</span> RECEIVED
          {pendingReceivedCount > 0 && (
            <span className="w-5 h-5 bg-[#ff8fab] text-black flex items-center justify-center text-xs">
              {pendingReceivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Matches Tab */}
      {showRequestsTab === "matches" && (
        <>
          {/* Match Mode Toggle */}
          <div className="retro-card bg-white p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-black uppercase">MATCH TYPE</h2>
                <p className="text-sm font-bold text-gray-600 mt-1">
                  {matchMode === "similar"
                    ? "Find peers who share your interests and strengths"
                    : "Find peers with complementary skills for balanced teams"}
                </p>
              </div>
              <div className="flex border-3 border-black">
                <button
                  onClick={() => setMatchMode("similar")}
                  className={`px-4 py-2 font-bold text-sm uppercase transition-colors ${
                    matchMode === "similar" ? "bg-[#c8f560]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  SIMILAR
                </button>
                <button
                  onClick={() => setMatchMode("complementary")}
                  className={`px-4 py-2 font-bold text-sm uppercase border-l-3 border-black transition-colors ${
                    matchMode === "complementary" ? "bg-[#ff8fab]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  COMPLEMENTARY
                </button>
              </div>
            </div>
          </div>

          {/* Matches Grid */}
          {matches && matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {matches.map((match) => (
                <div key={match.id} className="retro-card bg-white p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-[#6bb8ff] border-3 border-black flex items-center justify-center">
                        <span className="text-xl font-black">{match.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-black uppercase">{match.name}</h3>
                        <p className="text-xs font-bold text-gray-600">
                          {match.grade} • {match.campus}
                        </p>
                      </div>
                    </div>
                    <div className={`match-score ${getScoreColor(match.matchScore)}`}>
                      {match.matchScore}%
                    </div>
                  </div>

                  {match.lookingFor && (
                    <div className="retro-card-yellow p-3 mb-4">
                      <p className="text-sm font-bold">"{match.lookingFor}"</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-xs font-black uppercase mb-2">INTERESTS</h4>
                    <div className="flex flex-wrap gap-2">
                      {match.interests.map((interest) => (
                        <span key={interest} className="retro-tag bg-[#6bb8ff]">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-black uppercase mb-2">STRENGTHS</h4>
                    <div className="flex flex-wrap gap-2">
                      {match.strengths.map((strength) => (
                        <span key={strength} className="retro-tag bg-[#c8f560]">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRequestIntro(match)}
                    className="retro-btn retro-btn-pink w-full text-sm"
                  >
                    REQUEST INTRODUCTION
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="retro-card bg-white text-center py-12 mb-8">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-bold uppercase">NO MATCHES FOUND</p>
              <p className="text-sm font-bold text-gray-600 mt-2">
                {matchMode === "similar"
                  ? "Try complementary mode to find users with different skills"
                  : "Try similar mode to find users with shared interests"}
              </p>
              <button
                onClick={() => setMatchMode(matchMode === "similar" ? "complementary" : "similar")}
                className="retro-btn retro-btn-lime mt-4 text-sm"
              >
                TRY {matchMode === "similar" ? "COMPLEMENTARY" : "SIMILAR"} MATCHES
              </button>
            </div>
          )}

          {/* Looking for Teammates Section */}
          <div className="retro-card bg-white p-6 mb-6">
            <h2 className="font-black uppercase mb-4 flex items-center gap-2">
              <span className="text-xl">📢</span> LOOKING FOR TEAMMATES?
            </h2>
            <p className="text-sm font-bold text-gray-600 mb-4">
              Post what you're looking for and let others find you.
            </p>
            <textarea
              placeholder="E.g., Looking for a teammate for the upcoming hackathon. Need someone with design skills..."
              className="retro-input w-full resize-none"
              rows={3}
              value={lookingForText}
              onChange={(e) => setLookingForText(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !lookingForText.trim()}
                className="retro-btn retro-btn-lime text-sm disabled:opacity-50"
              >
                {isSavingProfile ? "SAVING..." : linkupProfile ? "UPDATE REQUEST" : "POST REQUEST"}
              </button>
            </div>
          </div>

          {/* Browse Teammate Requests Section */}
          <div className="retro-card bg-white p-6 mb-6">
            <h2 className="font-black uppercase mb-4 flex items-center gap-2">
              <span className="text-xl">👀</span> BROWSE TEAMMATE REQUESTS
            </h2>
            <p className="text-sm font-bold text-gray-600 mb-4">
              See what other students are looking for.
            </p>

            {teammateRequests && teammateRequests.length > 0 ? (
              <div className="space-y-4">
                {teammateRequests.map((request) => (
                  <div key={request._id} className="border-3 border-black p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ff8fab] border-3 border-black flex items-center justify-center flex-shrink-0">
                          <span className="font-black">{request.user?.name?.charAt(0) || "?"}</span>
                        </div>
                        <div>
                          <h4 className="font-black uppercase text-sm">{request.user?.name}</h4>
                          <p className="text-xs font-bold text-gray-600">
                            {request.user?.grade} • {request.user?.campus}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (request.user) {
                            setSelectedMatch({
                              id: request.user.id,
                              name: request.user.name,
                              grade: request.user.grade,
                              campus: request.user.campus,
                            });
                            setShowIntroModal(true);
                          }
                        }}
                        className="retro-btn retro-btn-pink text-xs flex-shrink-0"
                      >
                        CONNECT
                      </button>
                    </div>
                    <div className="mt-3 p-3 bg-[#fff06b] border-2 border-black">
                      <p className="text-sm font-bold">"{request.lookingFor}"</p>
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-2">
                      Posted {new Date(request.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-3 border-dashed border-gray-300">
                <p className="text-2xl mb-2">📝</p>
                <p className="font-bold text-gray-500">NO REQUESTS YET</p>
                <p className="text-xs font-bold text-gray-400 mt-1">
                  Be the first to post what you're looking for!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Sent Requests Tab */}
      {showRequestsTab === "sent" && (
        <div className="space-y-4 mb-8">
          {sentRequests && sentRequests.length > 0 ? (
            sentRequests.map((request) => (
              <div key={request._id} className="retro-card bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#6bb8ff] border-3 border-black flex items-center justify-center">
                      <span className="font-black">{request.toUser?.name?.charAt(0) || "?"}</span>
                    </div>
                    <div>
                      <h3 className="font-black uppercase">{request.toUser?.name || "Unknown"}</h3>
                      <p className="text-xs font-bold text-gray-600">
                        {request.toUser?.grade} • {request.toUser?.campus}
                      </p>
                    </div>
                  </div>
                  <span className={`retro-tag ${
                    request.status === "pending" ? "bg-[#fff06b]" :
                    request.status === "accepted" ? "bg-[#c8f560]" : "bg-gray-200"
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-600 border-t-3 border-black pt-3 mt-3">
                  "{request.message}"
                </p>
                {request.status === "accepted" && request.toUser?.email && (
                  <div className="mt-3 p-3 bg-[#c8f560] border-3 border-black">
                    <p className="text-xs font-black uppercase mb-1">CONTACT:</p>
                    <p className="font-bold">{request.toUser.email}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">📤</p>
              <p className="font-bold uppercase">NO SENT REQUESTS</p>
              <p className="text-sm font-bold text-gray-600 mt-2">
                Request introductions from the Matches tab!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Received Requests Tab */}
      {showRequestsTab === "received" && (
        <div className="space-y-4 mb-8">
          {receivedRequests && receivedRequests.length > 0 ? (
            receivedRequests.map((request) => (
              <div key={request._id} className="retro-card bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ff8fab] border-3 border-black flex items-center justify-center">
                      <span className="font-black">{request.fromUser?.name?.charAt(0) || "?"}</span>
                    </div>
                    <div>
                      <h3 className="font-black uppercase">{request.fromUser?.name || "Unknown"}</h3>
                      <p className="text-xs font-bold text-gray-600">
                        {request.fromUser?.grade} • {request.fromUser?.campus}
                      </p>
                    </div>
                  </div>
                  <span className={`retro-tag ${
                    request.status === "pending" ? "bg-[#fff06b]" :
                    request.status === "accepted" ? "bg-[#c8f560]" : "bg-gray-200"
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-600 border-t-3 border-black pt-3 mt-3">
                  "{request.message}"
                </p>
                {request.status === "pending" && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleRespondToRequest(request._id, false)}
                      className="retro-btn flex-1 text-sm"
                    >
                      DECLINE
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request._id, true)}
                      className="retro-btn retro-btn-lime flex-1 text-sm"
                    >
                      ACCEPT
                    </button>
                  </div>
                )}
                {request.status === "accepted" && request.fromUser?.email && (
                  <div className="mt-3 p-3 bg-[#c8f560] border-3 border-black">
                    <p className="text-xs font-black uppercase mb-1">CONTACT:</p>
                    <p className="font-bold">{request.fromUser.email}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="retro-card bg-white text-center py-12">
              <p className="text-4xl mb-4">📥</p>
              <p className="font-bold uppercase">NO RECEIVED REQUESTS</p>
              <p className="text-sm font-bold text-gray-600 mt-2">
                When someone wants to connect, you'll see it here!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Safety Notice */}
      <div className="retro-card-lime p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-black uppercase">SAFE CONNECTIONS ONLY</h3>
            <p className="text-sm font-bold mt-1">
              All introductions happen through verified Vinschool email addresses.
              No personal contact information is shared in the app.
            </p>
          </div>
        </div>
      </div>

      {/* Introduction Request Modal */}
      {showIntroModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="retro-card bg-white p-6 max-w-md w-full">
            <h2 className="font-black uppercase mb-4">REQUEST INTRODUCTION</h2>
            <p className="text-sm font-bold text-gray-600 mb-4">
              Send a message to introduce yourself to{" "}
              <span className="text-black">{selectedMatch.name}</span>. They'll
              receive this via their Vinschool email.
            </p>
            <textarea
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder="Hi! I saw that you're interested in... I'm working on a project about..."
              className="retro-input w-full resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowIntroModal(false);
                  setIntroMessage("");
                  setSelectedMatch(null);
                }}
                className="retro-btn flex-1 text-sm"
                disabled={isSending}
              >
                CANCEL
              </button>
              <button
                onClick={handleSendIntroRequest}
                disabled={isSending || !introMessage.trim()}
                className="retro-btn retro-btn-pink flex-1 text-sm disabled:opacity-50"
              >
                {isSending ? "SENDING..." : "SEND REQUEST"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
