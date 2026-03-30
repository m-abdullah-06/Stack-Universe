import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json(
        { error: "Missing universe data" },
        { status: 400 },
      );
    }

    const ageMonths = Math.round(data.accountAgeYears * 12);
    const ageLabel =
      ageMonths < 12
        ? `${ageMonths} months`
        : `${Math.round(data.accountAgeYears)} years`;

    const topLangs = data.languages
      .slice(0, 3)
      .map((l: any) => l.name)
      .join(", ");

    const topRepos = data.repos
      .slice(0, 3)
      .map((r: any) => `${r.name} (${r.stargazers_count} ★)`)
      .join(", ");

    const prompt = `
You are a witty, sharp, slightly savage developer analyst.
Analyze this GitHub data and return TWO things: 3 punchy observations AND a developer personality.

OBSERVATION RULES:
- Each observation must be under 12 words
- Slightly savage but never mean
- Never mention raw percentages or decimal numbers
- Never say the username
- Talk about what the data MEANS not what it IS
- Sound like a human not a data report
- No labels, no numbers, no "Observation #1" — just the line

NEVER PRODUCE THESE (too generic and lazy):
- "JavaScript reigns supreme here"
- "5 stars and counting slowly"
- "15 events in 90 days"
- "Stars are scarce but present"
- "New account with some momentum"
- "JavaScript dominance is clear"

GOOD EXAMPLES:
- "98% JavaScript — TypeScript is just a rumor in this universe"
- "5 stars — the multiverse hasn't discovered you yet, but it will"
- "4 months in and already shipping — dangerous early energy"
- "Stack-Universe leads with 3 stars — the flagship is finding orbit"
- "15 events in 90 days — a builder not just a dreamer"
- "Fresh universe — the asteroid belt is already forming fast"

PERSONALITY RULES:
- Assign ONE personality type with a creative name
- Write exactly 2 sentences — specific to their actual data
- Reference their real repo names, languages, activity patterns
- Be funny and accurate — like a zodiac sign but for developers
- Name examples: "The Midnight Architect", "The Serial Starter",
  "The TypeScript Evangelist", "The Open Source Ghost",
  "The Velocity Demon", "The Silent Legend", "The README Writer",
  "The Fork Collector", "The One Hit Wonder", "The Eternal Beginner",
  "The JavaScript Purist", "The Emerging Force"

PERSONALITY EXAMPLES:
Name: "The Serial Starter"
Description: "47 repos and counting — each one abandoned exactly when it gets hard. The asteroid belt doesn't lie: you start everything and finish nothing, but at least the ideas are fire."

Name: "The JavaScript Purist"
Description: "98% JavaScript and proud of it — TypeScript is a lifestyle choice you haven't made yet. Stack-Universe is the magnum opus, and it's only getting started."

Name: "The Velocity Demon"
Description: "50 commits this week, CI always green, streak that makes other developers feel lazy. You don't have bugs — bugs have you."

DATA:
- Primary language: ${data.dominantLanguage}
- Other languages: ${topLangs}
- Total stars: ${data.totalStars}
- Top repos: ${topRepos}
- Total repos: ${data.repos.length}
- Account age: ${ageLabel}
- Recent events (last 90 days): ${data.recentCommits.length}
- Streak: ${data.streak ?? 0} days

Return JSON only. No markdown. No backticks. No labels.

{
  "observations": [
    "observation one here",
    "observation two here",
    "observation three here"
  ],
  "personality": {
    "name": "The Personality Name",
    "description": "Two sentence description referencing their actual data."
  }
}
    `;

    const result = await getGroqCompletion(prompt);
    const cleanJson = result.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    } catch (err) {
      console.error("Failed to parse identity JSON:", result);
      return NextResponse.json({
        observations: [
          `${data.dominantLanguage} is home — and the whole universe knows it`,
          `${data.totalStars} stars so far — the multiverse is still learning your name`,
          `${ageLabel} in — still forming, already dangerous`,
        ],
        personality: {
          name: "The Emerging Force",
          description: `A universe ${ageLabel} old with ${data.repos.length} repos already in orbit — the foundations are being laid. ${data.dominantLanguage} flows through every planet here, and that focus is either a superpower or a comfort zone.`,
        },
      });
    }
  } catch (error) {
    console.error("Scan API Error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
