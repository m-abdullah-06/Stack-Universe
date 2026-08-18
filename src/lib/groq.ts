import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

/**
 * Shared helper for Groq AI interactions.
 * Uses qwen/qwen3.6-27b model.
 */
export async function getGroqCompletion(prompt: string, temp = 0.7) {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is missing. AI features will be disabled.");
    return "";
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "qwen/qwen3.6-27b",
      temperature: temp,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "";
  }
}
