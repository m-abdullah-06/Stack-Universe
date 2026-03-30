import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { query, repos } = await req.json();

    if (!query || !repos) {
      return NextResponse.json({ error: "Missing query or repo data" }, { status: 400 });
    }

    const prompt = `
      You are an AI assistant helping a developer find specific repositories in their "GitHub Universe" visualization.
      The user is asking: "${query}"
      
      Below is the list of repositories available (Name: Description). 
      Identify which ones match the user's intent.

      Repositories:
      ${repos.map((r: any) => `${r.name}: ${r.description || 'No description'}`).join("\n")}

      CRITICAL RULES:
      1. Return ONLY a comma-separated list of the EXACT repository names from the list above.
      2. If multiple match, separate them with commas: repo-name-1, repo-name-2
      3. Do NOT add any explanations, markdown, quotes, numbering, or preamble.
      4. If nothing matches, respond with exactly: NONE
      5. Match intelligently (e.g. "AI" matches repos with "machine learning", "gpt", "bot", etc. in name/description).
    `;

    const result = await getGroqCompletion(prompt);
    
    const sanitizedResult = result.trim().replace(/^["']+|["']+$/g, '');

    if (!sanitizedResult || sanitizedResult === "NONE") {
      return NextResponse.json({ matches: [] });
    }

    // Split by comma or newline, then strip away common AI list artifacts like numbers, bullets, and quotes
    const matches = sanitizedResult
      .split(/,|\n/)
      .map(name => name.replace(/^[\d\s.\-*]+/, '').replace(/["']/g, '').trim())
      .filter(name => name.length > 0);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("AI Query Error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
