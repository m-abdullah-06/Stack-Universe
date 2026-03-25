'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { motion } from "framer-motion"

interface LoginButtonProps {
  className?: string
  showAccount?: boolean
}

export function LoginButton({ className, showAccount = true }: LoginButtonProps) {
  const { data: session } = useSession()

  if (session) {
    if (!showAccount) return null
    return (
      <div className={`flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 ${className}`}>
        {session.user?.image && (
          <img src={session.user.image} className="w-5 h-5 rounded-full border border-white/20" alt="" />
        )}
        <div className="flex flex-col">
          <span className="font-mono text-[9px] text-gray-400 leading-none truncate max-w-[100px]">
            @{(session.user as any).login || session.user?.name}
          </span>
        </div>
        <button 
          onClick={() => signOut()}
          className="font-mono text-[9px] text-gray-600 hover:text-white transition-colors uppercase tracking-widest border-l border-white/10 pl-3 ml-1"
        >
          BYE
        </button>
      </div>
    )
  }

  return (
    <motion.button
      onClick={() => signIn('github')}
      className={`flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full font-mono text-[10px] tracking-widest text-gray-500 hover:text-white transition-all border border-white/10 ${className}`}
      whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
      whileTap={{ scale: 0.98 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      SIGN IN WITH GITHUB
    </motion.button>
  )
}
