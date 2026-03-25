import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params
  const normalizedUsername = username.toLowerCase()

  if (!supabaseAdmin) {
    console.error('[GET CLAIM] supabaseAdmin is missing!')
    return NextResponse.json({ error: 'DB_ADMIN_OFFLINE' }, { status: 503 })
  }

  console.log('[GET CLAIM] Fetching for:', normalizedUsername)

  const { data, error } = await supabaseAdmin
    .from('claims')
    .select('*')
    .eq('username', normalizedUsername)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[GET CLAIM] Not found:', normalizedUsername)
    } else {
      console.error('[GET CLAIM] Error:', error.message)
    }
    return NextResponse.json({ claim: null, error: error.code === 'PGRST116' ? null : error.message })
  }

  console.log('[GET CLAIM] Found:', data.username)
  return NextResponse.json({ claim: data })
}

export async function POST(
  req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).login !== username) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  if (!supabaseAdmin) return NextResponse.json({ error: 'DB_ADMIN_OFFLINE' }, { status: 503 })

  try {
    const { github_id } = await req.json()
    const normalizedUsername = username.toLowerCase()
    console.log('Claiming universe:', { username: normalizedUsername, github_id })

    // Check if already claimed (using lowercase)
    const { data: existing } = await supabaseAdmin
      .from('claims')
      .select('id')
      .or(`username.eq.${normalizedUsername},github_id.eq.${github_id}`)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'ALREADY_CLAIMED' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('claims')
      .insert([
        { 
          username: normalizedUsername, 
          github_id: github_id.toString(),
          star_color: '#ffffff',
          entry_msg: '',
          bio: '',
          pinned_repos: []
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase claim error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ claim: data })
  } catch (err: any) {
    console.error('API claim error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).login !== username) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  if (!supabaseAdmin) return NextResponse.json({ error: 'DB_ADMIN_OFFLINE' }, { status: 503 })

  const body = await req.json()
  const normalizedUsername = username.toLowerCase()
  
  // Only allow updating specific fields
  const updates = {
    star_color: body.star_color,
    entry_msg: body.entry_msg,
    bio: body.bio,
    pinned_repos: body.pinned_repos,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('claims')
    .update(updates)
    .eq('username', normalizedUsername)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ claim: data })
}
