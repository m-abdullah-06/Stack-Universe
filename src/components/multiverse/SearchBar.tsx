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
          className="relative flex items-center"
          style={{
            background: 'rgba(0,0,15,0.9)',
            border: `1px solid ${focused ? 'rgba(0,229,255,0.6)' : 'rgba(0,229,255,0.15)'}`,
            borderRadius: '4px',
            boxShadow: focused
              ? '0 0 20px rgba(0,229,255,0.15), inset 0 0 20px rgba(0,0,0,0.5)'
              : 'none',
            transition: 'all 0.2s',
          }}
        >
          {/* @ prefix */}
          <span className="pl-4 pr-1 font-orbitron text-space-cyan/40 text-lg select-none">
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
            className="flex-1 bg-transparent py-4 pr-4 font-orbitron text-lg text-white placeholder-gray-700 outline-none tracking-wide"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {/* Submit button */}
          <button
            type="submit"
            className="mr-2 px-4 py-2 font-mono text-xs tracking-widest transition-all"
            style={{
              color: value ? '#00e5ff' : '#1a3a4a',
              background: value ? 'rgba(0,229,255,0.1)' : 'transparent',
              border: `1px solid ${value ? 'rgba(0,229,255,0.3)' : 'transparent'}`,
              borderRadius: '2px',
            }}
          >
            LAUNCH →
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
