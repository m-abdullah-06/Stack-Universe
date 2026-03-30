import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json({ error: "Missing universe data" }, { status: 400 });
    }

    const prompt = `
      You are a legendary interstellar narrator. 
      Deliver a dramatic, cinematic 4-sentence documentary-style monologue about this developer's universe.
      
      Rules:
      - References actual repo names, language choices, and account history from the data.
      - Mention "light-year distance" or scale.
      - Use evocative language (e.g., "JavaScript nebula", "TypeScript belt", "burning stars").
      - Tone: Epic, philosophical, celebratory.
      - Return ONLY the 4 sentences of the monologue.

      Data:
      - Username: ${data.username}
      - Top Languages: ${data.languages.map((l: any) => l.name).join(", ")}
      - Distance: ${data.distanceLabel}
      - Total Stars: ${data.totalStars}
      - Top Repos: ${data.repos.slice(0, 3).map((r: any) => r.name).join(", ")}
      - Account Age: ${data.accountAgeYears} years
    `;

    const monologue = await getGroqCompletion(prompt);

    return NextResponse.json({ monologue });
  } catch (error) {
    console.error("Narrator Error:", error);
    return NextResponse.json({ error: "Failed to narrate universe" }, { status: 500 });
  }
}
