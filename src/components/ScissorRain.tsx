import { useMemo } from 'react'

/**
 * Background scissor rain for the loading screen. Renders a fixed pool of
 * scissors with stable per-instance random properties (memoized so they
 * don't re-randomize on every render and break the animation rhythm).
 */
type Props = {
  /** Brand color of the incoming style — applied to a subset of scissors. */
  brand: string
  /** How many scissors to render. Default 14 reads as "lively but not chaotic". */
  count?: number
}

const PALETTE = ['#1A1815', '#FF3D8A', '#5EC8E5', '#E2592C', '#B946D0', '#FFD93D']

export function ScissorRain({ brand, count = 14 }: Props) {
  const scissors = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100
      const drift = -50 + Math.random() * 100
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540)
      const dur = 4.2 + Math.random() * 3.6
      const delay = -Math.random() * dur // negative so they're already mid-fall on mount
      const size = 16 + Math.random() * 12
      // Every third scissor takes the brand color; rest cycle the Y2K palette.
      const color = i % 3 === 0 ? brand : PALETTE[i % PALETTE.length]
      return { i, left, drift, spin, dur, delay, size, color }
    })
    // Re-randomize only when count changes; brand changes are handled inline.
  }, [count])

  return (
    <div className="scissor-rain" aria-hidden>
      {scissors.map((s, idx) => (
        <Scissor
          key={s.i}
          size={s.size}
          color={idx % 3 === 0 ? brand : s.color}
          style={{
            left: `${s.left}%`,
            ['--drift' as never]: `${s.drift}px`,
            ['--spin' as never]: `${s.spin}deg`,
            ['--dur' as never]: `${s.dur}s`,
            ['--delay' as never]: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function Scissor({
  size,
  color,
  style,
}: {
  size: number
  color: string
  style: React.CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={style}
    >
      <circle cx="9" cy="9" r="4" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="23" r="4" stroke={color} strokeWidth="2" />
      <path
        d="M13 12 L28 27 M13 20 L28 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
