import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Style } from '../data/styles'
import { DogPortrait } from './DogPortrait'
import { StyledPhoto } from './StyledPhoto'

/**
 * Auto-playing before/after morph for the result screen + share asset.
 * Per design doc, v1 ships the client-side morph (cheap, runs on-device,
 * ~instant). The Pro server-side cinematic transition (Runway/Kling) is v1.5.
 *
 * Behaviour: 0–1.5s holds the before, 1.5–3.0s crossfades + scales/pushes
 * camera in, 3.0–4.5s holds the after, then loops. Total ~4.5s, vertical
 * 9:16 framing for share.
 */
type Props = {
  beforePhoto: string | null
  /** Real img2img output URL when available; otherwise the CSS-filter stand-in is used. */
  afterUrl?: string | null
  style: Style
  watermark: boolean
  paused?: boolean
  rounded?: boolean
}

export function MorphVideo({ beforePhoto, afterUrl, style, watermark, paused = false, rounded = true }: Props) {
  const [t, setT] = useState(0) // 0..1 morph progress
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 4500

  useEffect(() => {
    if (paused) return
    const loop = (now: number) => {
      if (startRef.current == null) startRef.current = now
      const elapsed = (now - startRef.current) % DURATION
      let phase = elapsed / DURATION
      // 0.0–0.30 hold before, 0.30–0.55 morph, 0.55–0.85 hold after, 0.85–1.0 reset
      let v = 0
      if (phase < 0.3) v = 0
      else if (phase < 0.55) v = ease((phase - 0.3) / 0.25)
      else if (phase < 0.85) v = 1
      else v = 1 - ease((phase - 0.85) / 0.15)
      setT(v)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startRef.current = null
    }
  }, [paused])

  const beforeStyle: CSSProperties = {
    opacity: 1 - t,
    transform: `scale(${1 + t * 0.06})`,
    transition: 'transform 60ms linear',
  }
  const afterStyle: CSSProperties = {
    opacity: t,
    transform: `scale(${1.06 - t * 0.06})`,
    transition: 'transform 60ms linear',
  }

  return (
    <div className={`relative w-full h-full bg-ink/5 overflow-hidden ${rounded ? 'rounded-3xl' : ''} grain`}>
      <div className="morph-stack">
        {beforePhoto ? (
          <img src={beforePhoto} alt="Before" style={beforeStyle} />
        ) : (
          <div style={beforeStyle}><DogPortrait baseline bgSeed={5} /></div>
        )}
        <div style={afterStyle}>
          {afterUrl ? (
            <img src={afterUrl} alt={`After: ${style.name}`} className="w-full h-full object-cover" />
          ) : beforePhoto ? (
            <StyledPhoto src={beforePhoto} style={style} />
          ) : (
            <DogPortrait style={style} bgSeed={6} />
          )}
        </div>
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.16) 100%)',
      }} />

      {/* Before / After labels */}
      <div className="absolute top-3 left-3 chip" style={{ opacity: 1 - t * 1.2 }}>before</div>
      <div className="absolute top-3 right-3 chip chip-dark" style={{ opacity: t }}>{style.name}</div>

      {watermark && <div className="watermark">made with coif</div>}
    </div>
  )
}

function ease(x: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}
