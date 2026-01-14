"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grid-lime flex items-center justify-center">
        <div className="retro-card p-8 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <span className="font-black uppercase">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-lime">
      {/* Header */}
      <header className="border-b-4 border-black bg-white">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#c8f560] border-3 border-black flex items-center justify-center">
              <span className="text-xl font-black">P</span>
            </div>
            <span className="text-xl font-black uppercase">PathFinderAI</span>
          </div>
          <Link href="/login" className="retro-btn retro-btn-lime">
            SIGN IN
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="retro-tag bg-[#6bb8ff] inline-block mb-6">
              EXCLUSIVELY FOR VINSCHOOL STUDENTS
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-tight">
              DISCOVER YOUR PATH TO{" "}
              <span className="bg-[#c8f560] px-2">SUCCESS</span>
            </h1>
            <p className="mt-6 text-lg font-bold text-gray-700 max-w-2xl mx-auto">
              Complete a personalized quiz, get AI-powered career recommendations,
              and connect with teammates who share your goals. Your journey starts here.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="retro-btn retro-btn-lime text-lg px-8 py-4">
                GET STARTED →
              </Link>
              <a href="#features" className="retro-btn text-lg px-8 py-4">
                LEARN MORE
              </a>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="retro-card bg-white p-6">
              <div className="w-14 h-14 bg-[#6bb8ff] border-3 border-black flex items-center justify-center mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-lg font-black uppercase mb-2">DISCOVER YOURSELF</h3>
              <p className="font-bold text-gray-600 text-sm">
                Take a quick quiz covering your interests, strengths, working style, and goals.
                Our AI assistant helps clarify your answers.
              </p>
            </div>

            <div className="retro-card bg-white p-6">
              <div className="w-14 h-14 bg-[#c8f560] border-3 border-black flex items-center justify-center mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="text-lg font-black uppercase mb-2">GET YOUR CAREER MAP</h3>
              <p className="font-bold text-gray-600 text-sm">
                Receive personalized career clusters, key skills to build, subjects to focus on,
                and a clear learning path with actionable steps.
              </p>
            </div>

            <div className="retro-card bg-white p-6">
              <div className="w-14 h-14 bg-[#ff8fab] border-3 border-black flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-lg font-black uppercase mb-2">LINKUP WITH TEAMMATES</h3>
              <p className="font-bold text-gray-600 text-sm">
                Find students with similar or complementary strengths. Connect safely through
                school email only - no strangers, just verified Vinschool peers.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24">
            <div className="retro-card-lime p-4 mb-8 text-center">
              <h2 className="text-2xl font-black uppercase">HOW IT WORKS</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: 1, title: "SIGN IN", desc: "Use your Vinschool Google account", emoji: "🔐" },
                { step: 2, title: "TAKE THE QUIZ", desc: "5-10 minutes to discover yourself", emoji: "📝" },
                { step: 3, title: "GET YOUR MAP", desc: "AI-generated career recommendations", emoji: "🎯" },
                { step: 4, title: "TAKE ACTION", desc: "Save activities and find teammates", emoji: "🚀" },
              ].map((item) => (
                <div key={item.step} className="retro-card bg-white p-6 text-center">
                  <div className="w-12 h-12 bg-[#fff06b] border-3 border-black flex items-center justify-center mx-auto font-black text-xl">
                    {item.step}
                  </div>
                  <span className="text-3xl block mt-4">{item.emoji}</span>
                  <h3 className="mt-3 font-black uppercase">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Section */}
          <div className="mt-24">
            <div className="retro-card bg-white p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-16 h-16 bg-[#c8f560] border-3 border-black flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔒</span>
                </div>
                <h2 className="text-2xl font-black uppercase mb-4">
                  SAFE & PRIVATE BY DESIGN
                </h2>
                <p className="font-bold text-gray-600 mb-8">
                  PathFinderAI is a closed ecosystem exclusively for Vinschool students and staff.
                  No public profiles, no external sharing, and all communication happens through
                  verified school email only.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="retro-card-lime p-4">
                    <p className="font-black uppercase">VERIFIED ONLY</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">Vinschool emails required</p>
                  </div>
                  <div className="retro-card-blue p-4">
                    <p className="font-black uppercase">ENCRYPTED DATA</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">At rest and in transit</p>
                  </div>
                  <div className="retro-card-pink p-4">
                    <p className="font-black uppercase">NO IN-APP CHAT</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">School email only</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <div className="retro-card-yellow p-8">
              <h2 className="text-2xl font-black uppercase mb-4">
                READY TO DISCOVER YOUR PATH?
              </h2>
              <p className="font-bold text-gray-700 mb-6">
                Join your Vinschool peers in building a clear roadmap for your future.
              </p>
              <Link href="/login" className="retro-btn retro-btn-lime text-lg px-8 py-4">
                GET STARTED NOW →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t-4 border-black bg-white px-6 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-black uppercase">PathFinderAI - Career Guidance for Vinschool Students</p>
          <p className="mt-2 font-bold text-gray-600 text-sm">Built with privacy and safety in mind.</p>
        </div>
      </footer>
    </div>
  );
}
