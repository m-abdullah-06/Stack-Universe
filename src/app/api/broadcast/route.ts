import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const admin = supabaseAdmin
  if (!admin) {
    return NextResponse.json({ success: false, reason: 'Supabase admin not configured' })
  }

  try {
    const { room, user, text } = await req.json()

    if (!room || !text) {
      return NextResponse.json({ error: 'room and text required' }, { status: 400 })
    }

    console.log(`[Broadcast API] Logging transmission in room ${room} by ${user || 'anonymous'}: ${text.slice(0, 20)}...`)
    
    // We use the activity_log table as a robust fallback for realtime chat since 
    // basic Broadcast might be disabled in the user's Supabase instance configuration.
    const { error: activityError } = await admin.from('activity_log').insert([{
      username: user || 'A cosmic traveler',
      action: 'transmitted',
      target: room.toLowerCase(),
      metadata: { text: text }
    }])

    if (activityError) {
      console.error('[Broadcast API] Activity Log Error:', activityError)
      throw activityError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Broadcast API] Critical failure:', err)
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 })
  }
}
