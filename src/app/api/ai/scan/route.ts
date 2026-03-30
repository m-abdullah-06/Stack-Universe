import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json({ error: "Missing universe data" }, { status: 400 });
    }

    const prompt = `
      You are an elite galaxy-class technical analyst. 
      Analyze the following GitHub universe data and provide exactly 3 extremely short, high-impact observations.
      
      Rules:
      - Each observation must be under 12 words.
      - Be specific to real data only (repo names, health, languages, commits, stars).
      - Sound technical, authoritative, and slightly futuristic.
      - Do not use markdown formatting in the bullet points.
      - Return ONLY the 3 bullet points, each on a new line.

      Data:
      - Username: ${data.username}
      - Top Languages: ${data.languages.map((l: any) => `${l.name} (${l.percentage}%)`).join(", ")}
      - Total Repos: ${data.repos.length}
      - Total Stars: ${data.totalStars}
      - Universe Health: ${data.universeScore}
      - Recent Repos: ${data.repos.slice(0, 5).map((r: any) => `${r.name} (stars: ${r.stargazers_count}, health: ${r.healthScore || 'N/A'})`).join(", ")}
      - Account Age: ${data.accountAgeYears} years
      - Streak: ${data.recentCommits.length} recent events
    `;

    const response = await getGroqCompletion(prompt);
    const observations = response.split("\n").filter(line => line.trim().length > 0).slice(0, 3);

    return NextResponse.json({ observations });
  } catch (error) {
    console.error("AI Scan Error:", error);
    return NextResponse.json({ error: "Failed to scan universe" }, { status: 500 });
  }
}
