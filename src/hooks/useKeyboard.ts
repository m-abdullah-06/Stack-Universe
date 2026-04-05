import { useEffect, useState } from 'react'

export function useKeyboard() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default behavior for flight keys (Space, Ctrl, Arrows, WASD)
      const flightKeys = ['Space', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (flightKeys.includes(e.code)) {
        e.preventDefault()
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: true }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: true }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: true }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: true }))
          break
        case 'Space':
          setKeys((k) => ({ ...k, up: true }))
          break
        case 'ShiftLeft':
        case 'ControlLeft':
        case 'ControlRight':
          setKeys((k) => ({ ...k, down: true }))
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: false }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: false }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: false }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: false }))
          break
        case 'Space':
          setKeys((k) => ({ ...k, up: false }))
          break
        case 'ShiftLeft':
        case 'ControlLeft':
        case 'ControlRight':
          setKeys((k) => ({ ...k, down: false }))
          break
      }
    }

    // Reset keys on window blur to prevent sticking
    const handleBlur = () => {
      setKeys({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return keys
}
