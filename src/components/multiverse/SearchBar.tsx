'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch?: (username: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const username = value.trim().replace(/^@/, '')
    if (!username) return
    if (username.length > 39) {
      setError('GitHub usernames max 39 chars')
      return
    }
    setError('')
    if (onSearch) {
      onSearch(username)
    } else {
      router.push(`/universe/${username}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg px-4">
      {/* Label */}
      <motion.p
        className="font-mono text-xs text-space-cyan/50 tracking-widest"
        animate={{ opacity: focused ? 1 : 0.5 }}
      >
        ENTER GITHUB USERNAME TO FIND YOUR UNIVERSE
      </motion.p>

      {/* Search field */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full"
      >
        <div
          className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 group/search"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(32px)',
            border: focused ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            boxShadow: focused
              ? '0 0 40px rgba(0,229,255,0.05), inset 0 0 20px rgba(0,0,0,0.2)'
              : 'none',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="flex items-center flex-1">
            {/* @ prefix */}
            <span className="pl-4 pr-1 font-orbitron text-space-cyan/40 text-lg md:text-xl select-none">
              @
            </span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="username"
              className="flex-1 bg-transparent py-4 md:py-5 pr-4 font-orbitron text-lg md:text-xl text-white placeholder-gray-800 outline-none tracking-wide"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Submit button — Responsive */}
          <button
            type="submit"
            className={`mx-2 mb-2 sm:mb-0 sm:mr-2 px-6 py-3 sm:py-2.5 font-mono text-[10px] sm:text-xs tracking-[0.3em] transition-all duration-500 rounded-lg
              ${value 
                ? 'bg-space-cyan/90 text-black font-bold shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:bg-space-cyan hover:scale-[1.02]' 
                : 'bg-white/5 text-gray-700 pointer-events-none'
              }`}
          >
            INITIATE_WARP
          </button>
        </div>

        {/* Scan line animation on focus */}
        {focused && (
          <motion.div
            className="absolute bottom-0 left-0 h-px bg-space-cyan"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.4 }}
          />
        )}
      </form>

      {/* Error message */}
      {error && (
        <motion.p
          className="font-mono text-xs text-space-magenta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⚠ {error}
        </motion.p>
      )}

      {/* Example usernames */}
      <div className="flex gap-3 flex-wrap justify-center">
        {['torvalds', 'gaearon', 'sindresorhus', 'yyx990803'].map((name) => (
          <button
            key={name}
            onClick={() => {
              setValue(name)
              setTimeout(() => {
                if (onSearch) onSearch(name)
                else router.push(`/universe/${name}`)
              }, 100)
            }}
            className="font-mono text-xs text-gray-700 hover:text-space-cyan/60 transition-colors"
          >
            @{name}
          </button>
        ))}
      </div>
    </div>
  )
}
