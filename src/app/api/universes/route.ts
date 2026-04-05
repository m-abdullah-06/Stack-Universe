import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Ghost Universes data for when DB is empty
const GHOST_UNIVERSES = [
  { id: '1', username: 'gaearon', universe_score: 95000, total_stars: 45000, position_x: -200, position_y: 50, position_z: -300, top_languages: ['JavaScript', 'TypeScript'] },
  { id: '2', username: 'torvalds', universe_score: 120000, total_stars: 100000, position_x: 300, position_y: -100, position_z: 150, top_languages: ['C', 'Shell'] },
  { id: '3', username: 'tj', universe_score: 85000, total_stars: 38000, position_x: -150, position_y: 120, position_z: 400, top_languages: ['JavaScript', 'Go'] },
  { id: '4', username: 'yyx990803', universe_score: 92000, total_stars: 50000, position_x: 450, position_y: -20, position_z: -250, top_languages: ['TypeScript', 'Vue'] },
  { id: '5', username: 'sindresorhus', universe_score: 110000, total_stars: 80000, position_x: 50, position_y: 200, position_z: -100, top_languages: ['JavaScript', 'TypeScript'] }
]

// GET all stored universes (for the multiverse background)
export async function GET() {
  const client = supabase
  if (!client) {
    return NextResponse.json({ universes: GHOST_UNIVERSES })
  }

  const { data, error } = await client
    .from('universes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Supabase GET error:', error)
    return NextResponse.json({ universes: GHOST_UNIVERSES })
  }

  // If map is completely empty, inject ghost universes
  const universes = (!data || data.length === 0) ? GHOST_UNIVERSES : data

  return NextResponse.json({ universes }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}

// POST — upsert a visited universe and log activity
export async function POST(req: NextRequest) {
  const admin = supabaseAdmin
  if (!admin) {
    return NextResponse.json({ success: false, reason: 'Supabase admin not configured' })
  }

  try {
    const body = await req.json()
    const {
      username,
      universe_score,
      total_stars,
      total_repos,
      language_count,
      account_age_years,
      visitor_username, // Added to log WHO is visiting
      top_languages // Added for constellations
    } = body

    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 })
    }

    // Assign a deterministic position based on username hash
    const hash = hashString(username)
    const position_x = (((hash & 0xff) / 255) * 2 - 1) * 800
    const position_y = ((((hash >> 8) & 0xff) / 255) * 2 - 1) * 200
    const position_z = ((((hash >> 16) & 0xff) / 255) * 2 - 1) * 800

    // 1. Upsert the universe
    console.log(`[API] Upserting universe for: ${username}...`)
    const { data: universe, error: universeError } = await admin.from('universes').upsert(
      {
        username,
        universe_score,
        total_stars,
        total_repos,
        language_count,
        account_age_years,
        position_x,
        position_y,
        position_z,
        top_languages: top_languages || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'username' }
    ).select().single()

    if (universeError) {
      console.error('[API] Upsert Error:', universeError)
      throw universeError
    }

    // 2. Log Activity for the Discovery Feed
    console.log(`[API] Logging activity for: ${visitor_username || 'anonymous'} -> ${username}...`)
    const { error: activityError } = await admin.from('activity_log').insert([{
      username: visitor_username || 'A cosmic traveler',
      action: 'explored',
      target: username,
      metadata: { score: universe_score, stars: total_stars }
    }])

    if (activityError) {
      console.error('[API] Activity Log Error:', activityError)
      // We don't throw here so the universe update still succeeds even if log fails
    }

    return NextResponse.json({ success: true, data: universe })
  } catch (err: any) {
    console.error('[API] Critical failure in /api/universes:', err)
    return NextResponse.json({ 
      success: false, 
      error: err.message, 
      details: err.hint || err.details || '' 
    }, { status: 500 })
  }
}

function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash
}
