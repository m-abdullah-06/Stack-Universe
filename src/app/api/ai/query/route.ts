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
      
      From the following list of repository names, identify and return a subset of names that best match or answer the user's query.
      
      Repository Names:
      ${repos.map((r: any) => r.name).join(", ")}

      Rules:
      - Return ONLY the exact repository names that match.
      - Separate names with commas.
      - If no repositories match, return "NONE".
      - Be intelligent about matching (e.g., if user asks for "AI projects", find repos with "ai", "ml", "llama", "gpt" in the name or description).

      Return format: repo1, repo2, repo3
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
