import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { username, repoName, description, language, lastPushed, recentCommits } = await req.json();

    if (!username || !repoName) {
      return NextResponse.json({ error: "Missing identity data" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // 1. Check cache
    const { data: existing } = await supabaseAdmin
      .from("repo_summaries")
      .select("*")
      .eq("username", username)
      .eq("reponame", repoName)
      .single();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const isRecentlyPushed = lastPushed > sevenDaysAgo;

    if (existing && (!isRecentlyPushed || existing.last_pushed_at >= lastPushed)) {
      return NextResponse.json({ summary: existing.summary, cached: true });
    }

    // 2. Generate new summary
    const prompt = `
      Create a one-sentence, plain English description of what this GitHub repository does.
      
      Details:
      - Name: ${repoName}
      - Primary Language: ${language || "Unknown"}
      - Description: ${description || "None provided"}
      - Recent Commits: ${recentCommits?.slice(0, 3).map((c: any) => c.message).join(", ") || "None"}

      Rules:
      - Max 18 words.
      - Be clear and avoid corporate buzzwords.
      - If it looks like a school project or experiment, say so.
      - Return ONLY the summary string.
    `;

    const summary = await getGroqCompletion(prompt);
    
    if (!summary) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    // 3. Cache in Supabase
    await supabaseAdmin.from("repo_summaries").upsert({
      username,
      reponame: repoName,
      summary,
      last_pushed_at: lastPushed,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ summary, cached: false });
  } catch (error) {
    console.error("Repo Summary Error:", error);
    return NextResponse.json({ error: "Failed to process summary" }, { status: 500 });
  }
}
