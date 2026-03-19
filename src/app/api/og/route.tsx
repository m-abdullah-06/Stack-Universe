import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('u')

    if (!username) {
      return new Response('Missing username', { status: 400 })
    }

    // Fetch data from our own API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stackuniverse.app'
    const res = await fetch(`${baseUrl}/api/github/${username}`)
    if (!res.ok) {
      return new Response('Failed to fetch universe data', { status: 500 })
    }
    const data = await res.json()

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000008',
            backgroundImage: 'radial-gradient(circle at center, #050015 0%, #000008 100%)',
            color: 'white',
            fontFamily: 'sans-serif',
            padding: '40px',
            position: 'relative',
          }}
        >
          {/* Grid lines background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              opacity: 0.1,
              zIndex: 0,
            }}
          >
             <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: 'linear-gradient(rgba(0,229,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            {/* Header / Brand */}
            <div style={{ display: 'flex', marginBottom: '40px', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(0,229,255,0.3)' }} />
              <div style={{ color: '#00e5ff', fontSize: '14px', letterSpacing: '0.2em', fontWeight: 'bold' }}>STACK UNIVERSE</div>
              <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(0,229,255,0.3)' }} />
            </div>

            {/* User Info Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '50px' }}>
              <img
                src={data.user.avatar_url}
                height="120"
                width="120"
                style={{
                  borderRadius: '50%',
                  border: '4px solid #00e5ff',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '64px', fontWeight: 'bold', lineHeight: 1 }}>{data.username}</div>
                <div style={{ fontSize: '24px', color: '#00e5ff', marginTop: '10px' }}>Level {Math.floor(data.universeScore / 1000)} Developer</div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '40px', marginBottom: '50px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '32px', color: '#00e5ff', fontWeight: 'bold' }}>{data.universeScore.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Universe Score</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '32px', color: '#ff006e', fontWeight: 'bold' }}>{data.totalStars.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Stars Earned</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '32px', color: '#7b2fff', fontWeight: 'bold' }}>{data.repos.length}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Planets Discovered</div>
              </div>
            </div>

            {/* Language Orbs / Top Languages */}
            <div style={{ display: 'flex', gap: '15px' }}>
               {data.languages.slice(0, 5).map((lang: any) => (
                 <div key={lang.name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '40px', gap: '8px', border: `1px solid ${lang.color}44` }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: lang.color, boxShadow: `0 0 10px ${lang.color}` }} />
                   <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{lang.name}</div>
                   <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{lang.percentage.toFixed(0)}%</div>
                 </div>
               ))}
            </div>

            {/* Footer / Distance */}
            <div style={{ position: 'absolute', bottom: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
               <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
                 UNIVERSE DISTANCE: {data.distanceLabel} // {data.lightYears.toLocaleString()} LIGHT YEARS
               </div>
            </div>
          </div>

          {/* Corner accents */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', width: '20px', height: '20px', borderTop: '2px solid rgba(0,229,255,0.3)', borderLeft: '2px solid rgba(0,229,255,0.3)' }} />
          <div style={{ position: 'absolute', top: '20px', right: '20px', width: '20px', height: '20px', borderTop: '2px solid rgba(0,229,255,0.3)', borderRight: '2px solid rgba(0,229,255,0.3)' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '20px', height: '20px', borderBottom: '2px solid rgba(0,229,255,0.3)', borderLeft: '2px solid rgba(0,229,255,0.3)' }} />
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '20px', height: '20px', borderBottom: '2px solid rgba(0,229,255,0.3)', borderRight: '2px solid rgba(0,229,255,0.3)' }} />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
