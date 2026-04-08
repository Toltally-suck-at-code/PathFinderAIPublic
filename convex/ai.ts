import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";
import { generateDeterministicCareerMap, generateDeterministicSummary } from "./careerAlgorithm";

// Initialize Gemini client
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

// Chat with AI during quiz for clarification
export const chatWithAI = action({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    message: v.string(),
    quizContext: v.object({
      currentStep: v.string(),
      currentResponses: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    const ai = getAIClient();

    const systemPrompt = `You are a friendly career guidance assistant for high school students at Vinschool in Vietnam.
Your role is to help students understand themselves better through a career discovery quiz.

Current quiz section: ${args.quizContext.currentStep}
Student's current responses: ${JSON.stringify(args.quizContext.currentResponses)}

Guidelines:
- Keep responses concise (2-3 sentences max)
- Be encouraging and supportive
- Ask clarifying questions to help students reflect
- Never make deterministic career predictions
- Focus on helping them understand their preferences, not diagnosing them
- Use simple, clear language appropriate for high school students
- Stay focused on the current quiz topic
- Do not ask about sensitive personal information`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: args.message }] },
        ],
      });

      const aiMessage = response.text || "I'm here to help! Could you tell me more about what you're thinking?";

      // Store the chat message
      await ctx.runMutation(api.ai.storeChatMessage, {
        userId: args.userId,
        sessionId: args.sessionId,
        role: "user",
        content: args.message,
      });

      await ctx.runMutation(api.ai.storeChatMessage, {
        userId: args.userId,
        sessionId: args.sessionId,
        role: "assistant",
        content: aiMessage,
      });

      return { message: aiMessage };
    } catch (error) {
      console.error("AI chat error:", error);
      return {
        message: "I'm having trouble responding right now. Please continue with the quiz, and feel free to ask again later!",
      };
    }
  },
});

// Store chat messages
export const storeChatMessage = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      userId: args.userId,
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// Get chat history for a session
export const getChatHistory = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Generate career map from quiz responses
export const generateCareerMap = action({
  args: {
    quizResponses: v.object({
      interests: v.array(v.string()),
      strengths: v.array(v.string()),
      workingStyle: v.object({
        teamPreference: v.string(),
        planningStyle: v.string(),
      }),
      values: v.array(v.string()),
      goals: v.array(v.string()),
    }),
  },
  handler: async (_ctx, args) => {
    // Step 1: Deterministic algorithm locks in the top 3 clusters (the "main idea")
    const baseMap = generateDeterministicCareerMap(args.quizResponses);

    // Step 2: Gemini analyzes the data within those guardrails
    try {
      const ai = getAIClient();

      const prompt = `You are a career guidance expert for Vietnamese high school students.

A student completed a career discovery quiz. Based on our scoring algorithm, their TOP 3 CAREER CLUSTERS have been determined as:
1. ${baseMap.clusters[0].name} — ${baseMap.clusters[0].description}
2. ${baseMap.clusters[1].name} — ${baseMap.clusters[1].description}
3. ${baseMap.clusters[2].name} — ${baseMap.clusters[2].description}

IMPORTANT: You MUST keep these exact 3 clusters in this exact order. Do NOT change, reorder, or replace them.

Here are the student's quiz responses:
- Interests: ${args.quizResponses.interests.join(", ")}
- Strengths: ${args.quizResponses.strengths.join(", ")}
- Team preference: ${args.quizResponses.workingStyle.teamPreference}
- Planning style: ${args.quizResponses.workingStyle.planningStyle}
- Values: ${args.quizResponses.values.join(", ")}
- Goals: ${args.quizResponses.goals.join(", ")}

Analyze the student's data and generate a personalized career map. Return ONLY valid JSON with this structure:
{
  "clusters": [
    { "name": "${baseMap.clusters[0].name}", "description": "${baseMap.clusters[0].description}", "whyItFits": "1-2 sentence personalized explanation referencing their specific interests/strengths" },
    { "name": "${baseMap.clusters[1].name}", "description": "${baseMap.clusters[1].description}", "whyItFits": "..." },
    { "name": "${baseMap.clusters[2].name}", "description": "${baseMap.clusters[2].description}", "whyItFits": "..." }
  ],
  "subjects": [
    { "name": "Subject Name", "priority": "high/medium/low", "reason": "Why this subject matters for their path" }
  ],
  "skills": {
    "hard": [{ "name": "Skill", "howToPractice": "Concrete actionable suggestion" }],
    "soft": [{ "name": "Skill", "howToPractice": "Concrete actionable suggestion" }]
  },
  "learningPaths": [
    { "step": 1, "title": "Step Title", "description": "What to do", "timeframe": "e.g. Now, Next 3 months, Grade 11-12" }
  ],
  "extracurriculars": ["Activity 1", "Activity 2"]
}

Guidelines:
- Keep the 3 clusters EXACTLY as specified above (same names, same descriptions)
- Include 4-6 subjects with priorities based on the locked clusters
- Provide 3-4 hard skills and 3-4 soft skills relevant to the clusters
- Create a 5-6 step learning path tailored to their planning style
- Suggest 4-6 extracurricular activities available in Vietnamese high schools
- Be specific and actionable, not generic

Return ONLY the JSON, no additional text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiMap = JSON.parse(jsonMatch[0]);

        // Validate that Gemini kept the correct clusters
        const clustersValid =
          aiMap.clusters?.length === 3 &&
          aiMap.clusters[0]?.name === baseMap.clusters[0].name &&
          aiMap.clusters[1]?.name === baseMap.clusters[1].name &&
          aiMap.clusters[2]?.name === baseMap.clusters[2].name;

        if (clustersValid && aiMap.subjects?.length >= 4 && aiMap.skills?.hard?.length >= 3) {
          // Gemini followed the rules — use its enriched output
          return aiMap;
        }
      }
    } catch (error) {
      console.error("Gemini analysis failed, using deterministic fallback:", error);
    }

    // Fallback: if Gemini fails or doesn't follow rules, use deterministic map
    return baseMap;
  },
});

// Summarize quiz responses for review
export const summarizeResponses = action({
  args: {
    quizResponses: v.object({
      interests: v.array(v.string()),
      strengths: v.array(v.string()),
      workingStyle: v.object({
        teamPreference: v.string(),
        planningStyle: v.string(),
      }),
      values: v.array(v.string()),
      goals: v.array(v.string()),
    }),
  },
  handler: async (_ctx, args) => {
    // Try Gemini for a natural-sounding summary
    try {
      const ai = getAIClient();

      const prompt = `Summarize this Vietnamese high school student's profile in a friendly, encouraging way (3-4 sentences):

Interests: ${args.quizResponses.interests.join(", ")}
Strengths: ${args.quizResponses.strengths.join(", ")}
Working Style: ${args.quizResponses.workingStyle.teamPreference}, ${args.quizResponses.workingStyle.planningStyle}
Values: ${args.quizResponses.values.join(", ")}
Goals: ${args.quizResponses.goals.join(", ")}

Be specific about what makes this student unique. Don't use generic phrases.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return { summary: response.text || generateDeterministicSummary(args.quizResponses) };
    } catch (error) {
      // Fall back to deterministic summary
      console.error("Summary generation error:", error);
      return { summary: generateDeterministicSummary(args.quizResponses) };
    }
  },
});
