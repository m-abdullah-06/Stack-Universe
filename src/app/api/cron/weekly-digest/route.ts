import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import Groq from 'groq-sdk'

const resend = new Resend(process.env.RESEND_API_KEY)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB_ADMIN_OFFLINE' }, { status: 503 })
  }

  try {
    // 1. Fetch all opted-in claims
    const { data: claims, error: claimsError } = await supabaseAdmin
      .from('claims')
      .select('*')
      .eq('weekly_digest', true)

    if (claimsError) throw claimsError
    if (!claims || claims.length === 0) {
      return NextResponse.json({ message: 'No users opted-in.' })
    }

    const results = []

    for (const claim of claims) {
      try {
        if (!claim.email) continue

        // 2. Fetch fresh GitHub data for the user
        // We'll use the user's username to get stats
        const githubRes = await fetch(`https://api.github.com/users/${claim.username}`)
        const githubData = await githubRes.json()
        
        const reposRes = await fetch(`https://api.github.com/users/${claim.username}/repos?sort=updated&per_page=10`)
        const reposData = await reposRes.json()

        const totalStars = reposData.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0)
        const recentRepo = reposData[0]?.name || 'N/A'

        // 3. Generate AI Summary via Groq
        const prompt = `
          You are the "Architect of the Universe". 
          Generate a short, inspiring "Weekly Cosmic Report" for a developer named ${claim.username}.
          
          Context:
          - Total Stars: ${totalStars}
          - Most Recent Activity: Worked on "${recentRepo}"
          - Bio: ${claim.bio || 'A cosmic explorer'}
          
          Rules:
          - Keep it under 100 words.
          - Use space/cosmic metaphors.
          - Sound premium, encouraging, and slightly mysterious.
          - End with a cosmic blessing.
          - Return ONLY the text.
        `

        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
        })

        const summary = chatCompletion.choices[0]?.message?.content || 'Your universe continues to expand in the silence of the void.'

        // 4. Send Email via Resend
        const emailRes = await resend.emails.send({
          from: 'Stack Universe <onboarding@resend.dev>',
          to: claim.email,
          subject: `✨ Weekly Cosmic Digest: The state of @${claim.username}`,
          html: `
            <div style="background-color: #020205; color: #ffffff; font-family: 'Orbitron', 'Inter', sans-serif; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid rgba(0, 229, 255, 0.2);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00e5ff; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; margin: 0;">Stack Universe</h1>
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Weekly Cosmic Intelligence</p>
              </div>
              
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h2 style="color: #ffd700; font-size: 14px; margin-top: 0; text-transform: uppercase; letter-spacing: 2px;">Report for @${claim.username}</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #e5e7eb; font-style: italic;">
                  "${summary}"
                </p>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); padding: 15px; border-radius: 10px; text-align: center;">
                  <p style="font-size: 9px; color: #00e5ff; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0;">Stellar Reach</p>
                  <p style="font-size: 18px; font-weight: bold; margin: 0;">★ ${totalStars}</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                  <p style="font-size: 9px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0;">Latest Discovery</p>
                  <p style="font-size: 14px; font-weight: bold; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${recentRepo}</p>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="https://stack-universe.xyz/${claim.username}" style="display: inline-block; background: #00e5ff; color: #000; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);">Visit Your Universe</a>
              </div>

              <div style="text-align: center; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.1); pt: 20px;">
                <p style="font-size: 10px; color: rgba(255, 255, 255, 0.3);">
                  You are receiving this because you opted-in to cosmic updates while claiming your universe.<br/>
                  <a href="https://stack-universe.xyz/manage" style="color: #00e5ff; text-decoration: none;">Manage Subscriptions</a>
                </p>
              </div>
            </div>
          `
        })
        
        console.log(`[RESEND] Response for ${claim.username}:`, emailRes)

        results.push({ username: claim.username, status: 'success', resendId: emailRes.data?.id })
      } catch (err: any) {
        console.error(`Failed to process digest for ${claim.username}:`, err)
        results.push({ username: claim.username, status: 'error', error: err.message })
      }
    }

    return NextResponse.json({ processed: results.length, details: results })
  } catch (err: any) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
