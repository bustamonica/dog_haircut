import { useEffect, useState } from 'react'
import { Button, Wordmark } from '../components/ui'
import { DogPortrait } from '../components/DogPortrait'
import { STYLES_BY_ID } from '../data/styles'
import { navigate } from '../state/store'

const ROTATION = ['mohawk', 'lion-cut', 'main-character', '70s-rockstar', 'hes-just-a-boy']

export function Splash() {
  const [idx, setIdx] = useState(0)
  const [hint, setHint] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx(n => (n + 1) % ROTATION.length), 2400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setHint(n => (n + 1) % HINTS.length), 3200)
    return () => clearInterval(id)
  }, [])

  const style = STYLES_BY_ID[ROTATION[idx]]

  return (
    <div className="flex flex-col h-full y2k-bg relative">
      {/* sparkles */}
      <span className="sparkle absolute top-20 left-8 text-rust" aria-hidden />
      <span className="sparkle absolute top-32 right-10 text-ember" aria-hidden style={{ animationDelay: '0.6s' }} />
      <span className="sparkle absolute bottom-32 left-12 text-ink/70" aria-hidden style={{ animationDelay: '1.2s' }} />
      <span className="sparkle absolute top-1/2 right-6 text-rust" aria-hidden style={{ animationDelay: '1.8s' }} />

      <div className="flex items-center justify-between px-5 pt-6 pb-2 relative">
        <Wordmark />
        <span className="chip text-[10px] uppercase tracking-widest">v0.1</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative">
        <div className="relative w-full max-w-sm aspect-square">
          {/* brand halo behind the after card */}
          <div
            className="brand-halo"
            style={{ ['--brand' as never]: style.brand }}
          />
          {/* Before */}
          <div
            key={`before-${idx}`}
            className="absolute inset-0 rounded-3xl overflow-hidden sticker animate-fade-up"
            style={{ animationDelay: '50ms' }}
          >
            <DogPortrait baseline bgSeed={idx} />
            <div className="absolute top-3 left-3 chip">before</div>
          </div>

          {/* After (peek) */}
          <div
            key={`after-${idx}`}
            className="absolute inset-x-6 bottom-[-32px] top-[28%] rounded-3xl overflow-hidden sticker animate-fade-up rotate-2"
            style={{ animationDelay: '200ms', transformOrigin: 'top right' }}
          >
            <DogPortrait style={style} bgSeed={idx + 1} />
            <div
              className="absolute top-3 right-3 chip text-[10px] font-semibold uppercase tracking-widest"
              style={{ background: style.brand, color: '#1A1815' }}
            >
              {style.name}
            </div>
            <div className="watermark">coif</div>
          </div>
        </div>

        <h1 className="font-display text-[44px] leading-[1.05] mt-12 tracking-tight">
          See the cut
          <br />
          <span className="italic">before</span> you book it.
        </h1>

        <p className="mt-3 text-sm text-ink/65 max-w-xs h-10 transition-opacity">
          {HINTS[hint]}
        </p>
      </div>

      <div className="px-5 pb-8 pt-4 flex flex-col gap-2 relative">
        <Button size="lg" className="chrome" onClick={() => navigate('capture')}>
          <span className="sparkle text-cream" aria-hidden /> Add your dog
        </Button>
        <p className="text-center text-xs text-ink/45 mt-1">
          One free re-roll. No card. No trial. No vibes-based pricing later.
        </p>
      </div>
    </div>
  )
}

const HINTS = [
  'For people who book grooming appointments and immediately spiral.',
  'Goldendoodle owners — we know what you did last summer.',
  'Show up to the groomer with a screenshot, not a vague hand gesture.',
  'No, we are not also doing cats.',
  'Built for the dog. Hostile to the algorithm.',
]
