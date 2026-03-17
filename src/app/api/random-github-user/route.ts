import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // There are over 100M GitHub users; we pick a random ID up to ~100M to find a random user
    const randomId = Math.floor(Math.random() * 100000000)
    
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'StackUniverse',
    }
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const res = await fetch(`https://api.github.com/users?since=${randomId}&per_page=1`, { 
      headers, 
      cache: 'no-store' 
    })

    if (!res.ok) {
      // fallback just in case
      return NextResponse.json({ username: 'torvalds' })
    }

    const data = await res.json()
    if (data && data.length > 0) {
      return NextResponse.json({ username: data[0].login })
    }

    return NextResponse.json({ username: 'torvalds' })
  } catch (error) {
    console.error('Failed to fetch random user:', error)
    return NextResponse.json({ username: 'torvalds' })
  }
}
