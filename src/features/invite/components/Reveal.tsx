'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Lets a section rise gently into place the first time it scrolls into view.
// The movement itself is in globals.css and only runs for guests who have not
// asked their device for less motion.
export function Reveal({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = box.current
    // A browser that cannot watch for scrolling just shows everything.
    if (!element || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={box} className="reveal" data-shown={shown}>
      {children}
    </div>
  )
}
