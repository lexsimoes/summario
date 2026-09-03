'use client'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Reveals its children as they scroll into view.
 *
 * The hidden state is applied by this effect, never by the server render. That
 * ordering is the whole point: if the JavaScript never arrives, or the browser
 * has no IntersectionObserver, the markup that shipped is already visible. An
 * entrance animation is decoration, and decoration must not be able to hide the
 * page.
 *
 * Honouring `prefers-reduced-motion` here as well as in CSS means the observer
 * is never even created for readers who asked for stillness.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode
  /** Seconds to stagger a group. Keep small — this is a hint, not a sequence. */
  delay?: number
  className?: string
  /** Reveal replaces the element it animates, so it has to carry its styles. */
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // A hidden tab freezes animations at their first keyframe and suspends the
    // observer, so an element staged here would be stranded invisible. Nothing
    // to reveal in a tab nobody is looking at anyway.
    if (document.hidden) return

    // Already on screen at mount (above the fold): show it without the observer
    // round trip, so the first paint is not a flash of hidden content.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9) {
      el.dataset.reveal = 'in'
      return
    }

    el.dataset.reveal = 'pending'

    /**
     * An observer always delivers one callback as soon as it starts observing,
     * so silence means it is not running — a background tab suspends delivery,
     * and so does more than one headless environment. Whatever the cause, the
     * page must not be left holding hidden content, so a missing first callback
     * simply shows everything. Losing the animation is the acceptable failure;
     * losing the text is not.
     */
    let started = false
    const failsafe = window.setTimeout(() => {
      // Drop the attribute rather than advancing it: 'in' starts an animation,
      // and an animation that cannot run holds its first frame, which is the
      // invisible one. With no attribute the element is simply itself.
      if (!started && el.dataset.reveal === 'pending') delete el.dataset.reveal
    }, 1200)

    const io = new IntersectionObserver(
      (entries) => {
        started = true
        window.clearTimeout(failsafe)
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.reveal = 'in'
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)

    return () => {
      window.clearTimeout(failsafe)
      io.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? { ...style, animationDelay: `${delay}s` } : style}
    >
      {children}
    </div>
  )
}
