import type { Style } from '../data/styles'

/**
 * Render the user's actual uploaded photo with a per-style CSS filter +
 * optional chromatic overlay. Stand-in for the real img2img pipeline
 * (Flux + ControlNet + IP-Adapter Face) described in the design doc.
 *
 * Cheap, runs on-device, and crucially keeps "their" dog visible — which
 * is the whole JTBD ("see THEIR dog with THAT cut").
 */

type Props = {
  src: string
  style: Style
  className?: string
  /**
   * If present, the photo is also given a cropped/zoomed framing tweak
   * to suggest a different silhouette (e.g. summer shave looks tighter).
   */
  zoom?: boolean
}

export function StyledPhoto({ src, style, className }: Props) {
  const { filter, overlay, blendOverlay, ringOverlay } = effectsFor(style)

  return (
    <div className={`relative w-full h-full overflow-hidden ${className ?? ''}`}>
      <img
        src={src}
        alt={`Your dog as ${style.name}`}
        className="w-full h-full object-cover"
        style={{ filter }}
      />
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: overlay,
            mixBlendMode: blendOverlay,
          }}
        />
      )}
      {ringOverlay && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '8% 12%',
            border: `${ringOverlay.width}px solid ${ringOverlay.color}`,
            borderRadius: '50%',
            opacity: ringOverlay.opacity,
            filter: 'blur(6px)',
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </div>
  )
}

type Effect = {
  filter: string
  overlay?: string
  blendOverlay?: 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'color' | 'normal'
  ringOverlay?: { color: string; opacity: number; width: number }
}

function effectsFor(style: Style): Effect {
  switch (style.id) {
    case 'teddy-bear':
      return { filter: 'contrast(1.05) saturate(1.1) brightness(1.05)' }
    case 'puppy-cut':
      return { filter: 'contrast(1.1) brightness(1.06)' }
    case 'kennel-cut':
      return { filter: 'contrast(1.18) brightness(0.97) saturate(0.9)' }
    case 'lion-cut':
      return {
        filter: 'contrast(1.12) saturate(1.25) brightness(1.04)',
        ringOverlay: { color: '#C97B3F', opacity: 0.35, width: 28 },
      }
    case 'continental':
      return { filter: 'contrast(1.18) saturate(1.05) brightness(1.04)' }
    case 'powder-puff':
      return { filter: 'brightness(1.12) contrast(0.95) saturate(0.9)' }
    case 'summer-shave':
      return { filter: 'contrast(1.25) brightness(1.1) saturate(0.95)' }
    case 'show-cut':
      return { filter: 'contrast(1.15) saturate(1.2) brightness(1.05)' }
    case 'mohawk':
      return {
        filter: 'contrast(1.2) saturate(1.1)',
        overlay: 'linear-gradient(180deg, rgba(26,24,21,0.75) 0%, rgba(26,24,21,0.75) 8%, transparent 9%, transparent 100%)',
        blendOverlay: 'multiply',
      }
    case '70s-rockstar':
      return {
        filter: 'sepia(0.25) contrast(1.15) saturate(1.3) brightness(1.02)',
        overlay: 'radial-gradient(circle at 50% 30%, transparent 50%, rgba(120, 60, 0, 0.35) 100%)',
        blendOverlay: 'multiply',
      }
    case 'wes-anderson':
      return {
        filter: 'sepia(0.5) saturate(1.4) contrast(1.05) hue-rotate(-10deg) brightness(1.05)',
        overlay: 'linear-gradient(180deg, rgba(217,185,138,0.18), rgba(184,140,80,0.18))',
        blendOverlay: 'multiply',
      }
    case 'hes-just-a-boy':
      return {
        filter: 'sepia(0.18) brightness(1.06) contrast(0.98) saturate(1.05)',
        overlay: 'radial-gradient(circle at 50% 35%, rgba(255,220,170,0.25), transparent 70%)',
        blendOverlay: 'soft-light',
      }
    case 'main-character':
      return {
        filter: 'contrast(1.2) saturate(1.4) brightness(1.06)',
        overlay: 'radial-gradient(circle at 50% 30%, transparent 35%, rgba(0,0,0,0.45) 100%)',
        blendOverlay: 'multiply',
      }
    case 'witness-protection':
      return {
        filter: 'contrast(1.05) brightness(0.95) blur(0.4px)',
        overlay: 'linear-gradient(180deg, rgba(26,24,21,0.55) 0%, rgba(26,24,21,0.55) 38%, transparent 60%)',
        blendOverlay: 'multiply',
      }
    case 'frosted-tips':
      return {
        filter: 'brightness(1.18) saturate(1.3) contrast(1.1)',
        overlay: 'radial-gradient(circle at 50% 25%, rgba(255,233,168,0.55), transparent 55%)',
        blendOverlay: 'screen',
      }
    case 'business-casual':
      return { filter: 'contrast(1.08) brightness(1.04) saturate(0.95)' }
    case 'autumn-drop':
      return {
        filter: 'sepia(0.45) saturate(1.4) hue-rotate(-15deg) contrast(1.08)',
        overlay: 'linear-gradient(180deg, rgba(201,123,63,0.22), rgba(150,80,30,0.18))',
        blendOverlay: 'multiply',
      }
    case 'winter-fluff':
      return {
        filter: 'brightness(1.12) contrast(1.05) saturate(0.9) hue-rotate(8deg)',
        overlay: 'linear-gradient(180deg, rgba(220,235,245,0.30), rgba(200,220,235,0.20))',
        blendOverlay: 'screen',
      }
    case 'designer-paloma':
      return {
        filter: 'contrast(1.12) saturate(1.05) hue-rotate(-12deg)',
        overlay: 'linear-gradient(135deg, rgba(94,122,140,0.25), transparent 60%)',
        blendOverlay: 'multiply',
      }
    case 'designer-emil':
      return {
        filter: 'grayscale(0.7) contrast(1.4) brightness(1.05)',
      }
    case 'rugrat':
      return {
        filter: 'sepia(0.2) brightness(1.04) saturate(1.1)',
        overlay: 'radial-gradient(circle at 50% 70%, rgba(0,0,0,0.2), transparent 60%)',
        blendOverlay: 'multiply',
      }
    case 'astroturf':
      return {
        filter: 'hue-rotate(70deg) saturate(1.6) contrast(1.1)',
        overlay: 'linear-gradient(180deg, rgba(159,203,107,0.35), rgba(120,170,80,0.22))',
        blendOverlay: 'multiply',
      }
    case 'sad-prince':
      return {
        filter: 'hue-rotate(-15deg) saturate(0.85) contrast(1.05) brightness(0.96)',
        overlay: 'radial-gradient(circle at 50% 40%, transparent 45%, rgba(20,30,55,0.35) 100%)',
        blendOverlay: 'multiply',
      }
    case 'bouncer':
      return {
        filter: 'contrast(1.3) brightness(0.92) saturate(0.95)',
        overlay: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 35%)',
        blendOverlay: 'multiply',
      }
    case 'spring-bloom':
      return {
        filter: 'brightness(1.12) saturate(1.15)',
        overlay: 'radial-gradient(circle at 50% 25%, rgba(242,184,198,0.35), transparent 55%)',
        blendOverlay: 'screen',
      }
    case 'father-figure':
      return {
        filter: 'saturate(0.7) contrast(1.05) brightness(1.02) hue-rotate(8deg)',
        overlay: 'radial-gradient(circle at 50% 30%, rgba(220,220,225,0.30), transparent 60%)',
        blendOverlay: 'screen',
      }
    case 'silent-film':
      return {
        filter: 'grayscale(1) contrast(1.35) brightness(1.05)',
        overlay: 'linear-gradient(180deg, rgba(0,0,0,0.18), transparent 30%)',
        blendOverlay: 'multiply',
      }
    default:
      return { filter: 'contrast(1.05) saturate(1.05)' }
  }
}
