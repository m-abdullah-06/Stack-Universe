import { NextRequest, NextResponse } from 'next/server'
import { fetchUniverseData } from '@/lib/github'

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params

  if (!username || username.length > 39) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  try {
    const data = await fetchUniverseData(username)
    return NextResponse.json(data)
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'USER_NOT_FOUND') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (err.message === 'RATE_LIMITED') {
        return NextResponse.json(
          { error: 'GitHub rate limit reached. Add GITHUB_TOKEN to .env.local' },
          { status: 429 }
        )
      }
    }
    console.error('GitHub API error:', err)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
