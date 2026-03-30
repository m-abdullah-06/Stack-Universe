import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { query, universeData } = await req.json();

    if (!query || !universeData || !universeData.repos) {
      return NextResponse.json({ error: "Missing query or universe data" }, { status: 400 });
    }

    const prompt = `
      You are a high-precision repository search engine. 
      Your task is to identify which repositories from the list below match the user's search query.
      
      Repositories available for matching:
      ${universeData.repos.map((r: any) => `- ${r.name}: ${r.description || 'No description'} | Language: ${r.language || 'N/A'}`).join("\n")}

      USER SEARCH QUERY: "${query}"

      TASK:
      1. Identify exactly which repository names from the list above match the query.
      2. Return ONLY a JSON object with the matched names.

      OUTPUT FORMAT (JSON ONLY):
      {
        "matches": ["repo-name-1", "repo-name-2"]
      }
    `;

    const result = await getGroqCompletion(prompt);
    const cleanJson = result.replace(/```json|```/g, "").trim();
    
    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    } catch (err) {
      console.error("Failed to parse search JSON:", result);
      return NextResponse.json({ matches: [] });
    }
  } catch (error) {
    console.error("AI Search Error:", error);
    return NextResponse.json({ error: "Search logic offline" }, { status: 500 });
  }
}
