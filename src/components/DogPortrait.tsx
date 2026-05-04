import type { Style } from '../data/styles'

/**
 * Programmable SVG dog portrait. The shape responds to coat parameters from
 * Style.coat so we can plausibly visualize "before vs after" without an actual
 * img2img model running. This is the demo stand-in for the real generation
 * pipeline described in the design doc.
 *
 * The user's uploaded photo is used as the "before" wherever possible; this
 * SVG is reserved for example transformations and the always-on baseline.
 */
type Props = {
  style?: Style | null
  baseTone?: string
  className?: string
  expression?: 'neutral' | 'happy' | 'sad' | 'wow'
  /** When true the dog is rendered at "before" baseline regardless of style. */
  baseline?: boolean
  /** Override coat colour, used for breed-specific tints in onboarding. */
  coatColor?: string
  /** Background gradient seed so each portrait reads slightly different. */
  bgSeed?: number
}

const DEFAULT_TONE = '#D7A86E'

export function DogPortrait({
  style,
  baseTone = DEFAULT_TONE,
  className,
  expression = 'happy',
  baseline = false,
  coatColor,
  bgSeed = 0,
}: Props) {
  const fluffBody = baseline ? 0.7 : (style?.coat.bodyFluff ?? 0.7)
  const fluffHead = baseline ? 0.7 : (style?.coat.headFluff ?? 0.7)
  const fluffEar = baseline ? 0.75 : (style?.coat.earFluff ?? 0.75)
  const tone = coatColor ?? style?.coat.tone ?? baseTone
  const accent = baseline ? undefined : style?.coat.accent
  const silhouette = baseline ? 'standard' : (style?.coat.silhouette ?? 'standard')

  const ringX = 200
  const ringY = 230

  // Body radius scales with body fluff
  const bodyRX = 130 + fluffBody * 32
  const bodyRY = 78 + fluffBody * 24

  // Head radius scales with head fluff
  const headR = 70 + fluffHead * 26

  // Ears scale with ear fluff
  const earH = 40 + fluffEar * 60

  const bg1 = ['#FBE9D2', '#E6F0E1', '#EDE3F0', '#FFE5D9', '#E0EBF7'][bgSeed % 5]
  const bg2 = ['#F4D3A6', '#C9DDC0', '#D9C5DE', '#FFC9B0', '#BCD3EE'][bgSeed % 5]

  const eyeOffset = expression === 'sad' ? 4 : expression === 'wow' ? -4 : 0
  const mouthD =
    expression === 'sad'
      ? 'M 188 122 Q 200 116 212 122'
      : expression === 'wow'
        ? 'M 196 120 Q 200 132 204 120'
        : 'M 188 122 Q 200 130 212 122'

  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={`bg-${bgSeed}`} cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </radialGradient>
        <radialGradient id={`coat-${tone.replace('#','')}-${bgSeed}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={lighten(tone, 14)} />
          <stop offset="60%" stopColor={tone} />
          <stop offset="100%" stopColor={darken(tone, 12)} />
        </radialGradient>
        <filter id={`fluff-${bgSeed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={bgSeed + 3} />
          <feDisplacementMap in="SourceGraphic" scale={fluffBody * 6 + 2} />
        </filter>
        <filter id={`grain-${bgSeed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed={bgSeed} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      <rect width="400" height="400" fill={`url(#bg-${bgSeed})`} />

      {/* Soft halo */}
      <ellipse cx={ringX} cy={ringY + 30} rx={bodyRX + 20} ry={bodyRY + 20} fill="rgba(255,255,255,0.35)" />

      {/* Body */}
      <ellipse
        cx={ringX}
        cy={ringY + 8}
        rx={bodyRX}
        ry={bodyRY}
        fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`}
      />

      {/* Tail */}
      {silhouette !== 'shaved' && (
        <ellipse
          cx={ringX + bodyRX - 12}
          cy={ringY - 18}
          rx={18 + fluffBody * 10}
          ry={36 + fluffBody * 14}
          fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`}
          transform={`rotate(-30 ${ringX + bodyRX - 12} ${ringY - 18})`}
        />
      )}

      {/* Tail pom (continental) */}
      {silhouette === 'sculpted' && (
        <circle cx={ringX + bodyRX + 4} cy={ringY - 56} r={26} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
      )}

      {/* Lion mane */}
      {silhouette === 'lion-mane' && (
        <ellipse cx={ringX - 36} cy={130} rx={104} ry={86} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
      )}

      {/* Legs */}
      <rect x={ringX - 70} y={ringY + 60} width={22} height={48} rx={10} fill={tone} />
      <rect x={ringX - 18} y={ringY + 60} width={22} height={48} rx={10} fill={tone} />
      <rect x={ringX + 32} y={ringY + 60} width={22} height={48} rx={10} fill={tone} />
      <rect x={ringX + 78} y={ringY + 60} width={22} height={48} rx={10} fill={tone} />

      {/* Continental leg poms */}
      {silhouette === 'sculpted' && (
        <>
          <circle cx={ringX - 60} cy={ringY + 100} r={20} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
          <circle cx={ringX - 8} cy={ringY + 100} r={20} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
          <circle cx={ringX + 42} cy={ringY + 100} r={20} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
          <circle cx={ringX + 88} cy={ringY + 100} r={20} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
        </>
      )}

      {/* Ears (back layer) */}
      <ellipse
        cx={ringX - headR + 8}
        cy={140}
        rx={18 + fluffEar * 10}
        ry={earH}
        fill={darken(tone, 8)}
        transform={`rotate(-12 ${ringX - headR + 8} 140)`}
      />
      <ellipse
        cx={ringX + headR - 8}
        cy={140}
        rx={18 + fluffEar * 10}
        ry={earH}
        fill={darken(tone, 8)}
        transform={`rotate(12 ${ringX + headR - 8} 140)`}
      />

      {/* Head */}
      <circle
        cx={ringX}
        cy={130}
        r={headR}
        fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`}
      />

      {/* Topknot */}
      {(silhouette === 'topknot' || silhouette === 'sculpted') && (
        <ellipse cx={ringX} cy={68} rx={32} ry={26} fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`} />
      )}

      {/* Mohawk ridge */}
      {silhouette === 'mohawk' && (
        <path
          d={`M ${ringX - 8} 60 L ${ringX + 8} 60 L ${ringX + 12} 130 L ${ringX - 12} 130 Z`}
          fill={accent ?? '#1A1815'}
        />
      )}

      {/* Mullet tail */}
      {silhouette === 'mullet' && (
        <ellipse
          cx={ringX + bodyRX + 18}
          cy={ringY + 6}
          rx={26}
          ry={42}
          fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`}
        />
      )}

      {/* Snout */}
      <ellipse cx={ringX} cy={140} rx={28} ry={22} fill={lighten(tone, 6)} />

      {/* Nose */}
      <ellipse cx={ringX} cy={132} rx={9} ry={6} fill="#1A1815" />

      {/* Eyes */}
      <circle cx={ringX - 22} cy={118 + eyeOffset} r="6" fill="#1A1815" />
      <circle cx={ringX + 22} cy={118 + eyeOffset} r="6" fill="#1A1815" />
      <circle cx={ringX - 20} cy={116 + eyeOffset} r="2" fill="#FAF6EE" />
      <circle cx={ringX + 24} cy={116 + eyeOffset} r="2" fill="#FAF6EE" />

      {/* Mouth */}
      <path d={mouthD} stroke="#1A1815" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Forehead fringe (witness protection / he's just a boy / wes anderson) */}
      {fluffHead > 0.85 && (
        <path
          d={`M ${ringX - headR + 14} 96 Q ${ringX} ${110 + fluffHead * 18} ${ringX + headR - 14} 96`}
          fill={`url(#coat-${tone.replace('#','')}-${bgSeed})`}
        />
      )}

      {/* Accent splash for dye styles */}
      {accent && silhouette !== 'mohawk' && (
        <ellipse
          cx={ringX - bodyRX + 30}
          cy={ringY + 70}
          rx={18}
          ry={26}
          fill={accent}
          opacity="0.85"
        />
      )}

      {/* Saturation overlay (silent film) */}
      {style?.coat.saturate === 0 && (
        <rect width="400" height="400" fill="white" opacity="0.18" style={{ mixBlendMode: 'saturation' as never }} />
      )}

      {/* Subtle film grain */}
      <rect width="400" height="400" filter={`url(#grain-${bgSeed})`} opacity="0.6" />
    </svg>
  )
}

function clamp(n: number, lo = 0, hi = 255) {
  return Math.max(lo, Math.min(hi, n))
}

function shift(hex: string, amount: number) {
  const h = hex.replace('#', '')
  const num = parseInt(h, 16)
  const r = clamp(((num >> 16) & 255) + amount)
  const g = clamp(((num >> 8) & 255) + amount)
  const b = clamp((num & 255) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function lighten(hex: string, amount: number) {
  return shift(hex, amount)
}
function darken(hex: string, amount: number) {
  return shift(hex, -amount)
}
