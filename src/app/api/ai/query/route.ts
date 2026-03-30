import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { query, repos } = await req.json();

    if (!query || !repos) {
      return NextResponse.json({ error: "Missing query or repo data" }, { status: 400 });
    }

    const prompt = `
      You are an AI assistant that helps developers search their GitHub universes.
      The user is asking a question: "${query}"
      
      From the following list of repositories, identify and return a subset of names that best match or answer the user's query.
      
      Repositories:
      ${repos.map((r: any) => `${r.name}: ${r.description || 'No description'}`).join("\n")}

      Rules:
      - Return ONLY the exact repository names that match.
      - Separate names with commas (e.g., repo1, repo2, repo3).
      - Do not include any other text, reasoning, markdown formatting, or preamble.
      - If no repositories match, return the exact word "NONE".
      - Be intelligent about matching context (e.g., if user asks for "AI projects", find repos with "ai", "ml", "llama", "gpt" in the name or description).
    `;

    const result = await getGroqCompletion(prompt);
    
    if (!result || result.trim() === "NONE") {
      return NextResponse.json({ matches: [] });
    }

    const matches = result.split(",").map(name => name.trim()).filter(name => name.length > 0);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("AI Query Error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
