import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all stored universes (for the multiverse background)
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ universes: [] })
  }

  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Supabase GET error:', error)
    return NextResponse.json({ universes: [] })
  }

  return NextResponse.json({ universes: data || [] })
}

// POST — upsert a visited universe
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ success: false, reason: 'Supabase not configured' })
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
    } = body

    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 })
    }

    // Assign a deterministic position based on username hash
    const hash = hashString(username)
    const position_x = (((hash & 0xff) / 255) * 2 - 1) * 800
    const position_y = ((((hash >> 8) & 0xff) / 255) * 2 - 1) * 200
    const position_z = ((((hash >> 16) & 0xff) / 255) * 2 - 1) * 800

    const { data, error } = await supabase.from('universes').upsert(
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'username' }
    )

    if (error) {
      console.error('Supabase POST error:', error)
      return NextResponse.json({ success: false })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Universe POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
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
