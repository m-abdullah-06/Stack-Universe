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

    const prompt = `
      You are an absolutely UNHINGED, savagely funny stand-up comedian roasting a software engineer's GitHub profile. 
      Your goal is to make the reader get a stomachache from laughing. This should be a completely ruthless, tear-inducing, deeply personal-feeling destruction of their coding life.
      
      Rules:
      - Max 4 sentences of pure concentrated comedic violence.
      - Be HYPER-SPECIFIC. Name drop their actual repos, stars, and languages.
      - Use internet culture, gaming references, or Gen Z / millennial meme language ("skill issue", "touch grass", "main character energy").
      - Make bizarre, hilarious comparisons: "Your repository is like a Blockbuster video store in 2024 — full of old artifacts and absolutely nobody visits it."
      - Call out their delusions based on their stats (e.g., "having 4 forks doesn't make you an open source maintainer, it means 4 people accidentally clicked the button").
      - Make fun of the sheer tragedy of their statistics.
      - END WITH A FATAL, GUT-WRENCHING PUNCHLINE, perfectly followed by a variation of this sign-off customized to their stats: "But hey, it's all good, it's just a joke... kinda like your [insert their worst language/repo/coding career here]. Hope it made you smile 💀"
      - DO NOT hold back. DO NOT be generic. Make them regret asking for this roast before hitting them with that final sarcastic wholesome ending.
      - Return ONLY the roasted paragraph.
      

      Developer Data (Ammunition):
      - Username: ${data.username}
      - Top Languages: ${data.languages.map((l: any) => l.name).join(", ")}
      - Total Stars: ${data.totalStars}
      - Total Repos: ${data.repos.length}
      - Repos with 0 stars: ${data.repos.filter((r: any) => r.stargazers_count === 0).length}
      - Most starred repo: ${data.repos.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)[0]?.name || "Nothing"} (${data.repos.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)[0]?.stargazers_count || 0} stars)
      - Repos abandoned >1 year: ${data.repos.filter((r: any) => Date.now() - new Date(r.pushed_at).getTime() > 1000 * 60 * 60 * 24 * 365).length}
      - Forked repos (meaning they didn't even write it): ${data.repos.filter((r: any) => r.fork).length}
      - Recent activity: ${data.recentCommits.length} events
      - Account age: ${Math.floor((Date.now() - new Date(data.user.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
    `;

    const roast = await getGroqCompletion(prompt);

    return NextResponse.json({ roast });
  } catch (error) {
    console.error("Roast Error:", error);
    return NextResponse.json(
      { error: "Failed to roast universe" },
      { status: 500 },
    );
  }
}
