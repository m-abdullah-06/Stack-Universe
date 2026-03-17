export default function Loading() {
  // The username page handles its own loading states via the cinematic.
  // This file satisfies Next.js's loading.tsx convention for route segments
  // and is shown for the very first server-side render before client hydration.
  return (
    <div className="w-screen h-screen bg-[#000008] flex flex-col items-center justify-center gap-4">
      <div
        className="w-12 h-12 rounded-full"
        style={{
          border: '1px solid rgba(0,229,255,0.2)',
          borderTop: '1px solid #00e5ff',
          animation: 'spin 1.5s linear infinite',
        }}
      />
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: 'rgba(0,229,255,0.4)',
          letterSpacing: '0.15em',
        }}
      >
        INITIALIZING WARP DRIVE...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
