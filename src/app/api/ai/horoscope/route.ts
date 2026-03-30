import { NextRequest, NextResponse } from "next/server";
import { getGroqCompletion } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data || !data.username) {
      return NextResponse.json({ error: "Missing universe data" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // 1. Calculate week offset (YYYYWW)
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekOffset = parseInt(`${year}${week.toString().padStart(2, '0')}`);

    // 2. Check cache
    const { data: existing } = await supabaseAdmin
      .from("horoscopes")
      .select("*")
      .eq("username", data.username)
      .eq("week_offset", weekOffset)
      .single();

    if (existing) {
      return NextResponse.json({ horoscope: existing.horoscope, cached: true });
    }

    // 3. Generate new horoscope
    const prompt = `
      Create a mystical yet highly technical weekly horoscope for this developer's universe.
      
      Themes:
      - Technology stack: ${data.languages.map((l: any) => l.name).join(", ")}
      - Stars: ${data.totalStars}
      - Activity: ${data.recentCommits.length} events
      
      Rules:
      - Max 60 words.
      - Use mystical tech-jargon (e.g., "The moon enters your 443 port", "Mercury retrograde in your production branch", "A alignment of Docker containers").
      - Tone: Cryptic, cosmic, and extremely nerdy.
      - Return ONLY the horoscope text.
    `;

    const horoscope = await getGroqCompletion(prompt);

    if (!horoscope) {
      return NextResponse.json({ error: "Failed to generate horoscope" }, { status: 500 });
    }

    // 4. Cache in Supabase
    await supabaseAdmin.from("horoscopes").upsert({
      username: data.username,
      horoscope,
      week_offset: weekOffset,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ horoscope, cached: false });
  } catch (error) {
    console.error("Horoscope Error:", error);
    return NextResponse.json({ error: "Failed to process horoscope" }, { status: 500 });
  }
}
