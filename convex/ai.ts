import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";

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
  handler: async (ctx, args) => {
    const ai = getAIClient();

    const prompt = `You are a career guidance expert helping a Vietnamese high school student discover potential career paths.

Based on the following quiz responses, generate a personalized career map:

**Interests:** ${args.quizResponses.interests.join(", ")}
**Strengths:** ${args.quizResponses.strengths.join(", ")}
**Working Style:**
- Team preference: ${args.quizResponses.workingStyle.teamPreference}
- Planning style: ${args.quizResponses.workingStyle.planningStyle}
**Values:** ${args.quizResponses.values.join(", ")}
**Goals:** ${args.quizResponses.goals.join(", ")}

Generate a JSON response with this exact structure:
{
  "clusters": [
    {
      "name": "Career Cluster Name",
      "description": "Brief description of this career area",
      "whyItFits": "Personalized explanation of why this fits the student"
    }
  ],
  "subjects": [
    {
      "name": "Subject Name",
      "priority": "high/medium/low",
      "reason": "Why this subject is important for their path"
    }
  ],
  "skills": {
    "hard": [
      {
        "name": "Skill Name",
        "howToPractice": "Concrete suggestion for practicing this skill"
      }
    ],
    "soft": [
      {
        "name": "Skill Name",
        "howToPractice": "Concrete suggestion for developing this skill"
      }
    ]
  },
  "learningPaths": [
    {
      "step": 1,
      "title": "Step Title",
      "description": "What to do in this step",
      "timeframe": "e.g., Now, Next 6 months, Grade 11-12"
    }
  ],
  "extracurriculars": ["Activity 1", "Activity 2", "Activity 3"]
}

Guidelines:
- Provide exactly 3 career clusters
- Include 4-6 subjects with clear priorities
- Provide 3-4 hard skills and 3-4 soft skills
- Create a 5-6 step learning path
- Suggest 4-6 extracurricular activities
- Keep explanations concise but actionable
- Always show multiple options, never single-path predictions
- Make suggestions specific to a Vietnamese high school context

Return ONLY the JSON, no additional text.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const responseText = response.text || "";

      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }

      const careerMap = JSON.parse(jsonMatch[0]);
      return careerMap;
    } catch (error) {
      console.error("Career map generation error:", error);
      throw new Error("Failed to generate career map. Please try again.");
    }
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
  handler: async (ctx, args) => {
    const ai = getAIClient();

    const prompt = `Summarize this student's profile in a friendly, encouraging way (3-4 sentences):

Interests: ${args.quizResponses.interests.join(", ")}
Strengths: ${args.quizResponses.strengths.join(", ")}
Working Style: ${args.quizResponses.workingStyle.teamPreference}, ${args.quizResponses.workingStyle.planningStyle}
Values: ${args.quizResponses.values.join(", ")}
Goals: ${args.quizResponses.goals.join(", ")}

Be specific about what makes this student unique. Don't use generic phrases.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return { summary: response.text || "You have a unique combination of interests and strengths!" };
    } catch (error) {
      console.error("Summary generation error:", error);
      return { summary: "You have a unique combination of interests and strengths that will help guide your career journey!" };
    }
  },
});
