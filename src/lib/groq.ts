import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

/**
 * Shared helper for Groq AI interactions.
 * Uses llama3-70b-8192 model.
 */
export async function getGroqCompletion(prompt: string, temp = 0.7) {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is missing. AI features will be disabled.");
    return "";
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: temp,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "";
  }
}
