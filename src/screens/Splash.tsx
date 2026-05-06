import { useEffect, useState } from 'react'
import { Button, Wordmark } from '../components/ui'
import { MorphVideo } from '../components/MorphVideo'
import { STYLES_BY_ID } from '../data/styles'
import { navigate, useStore } from '../state/store'

// On a cold first-open, the hero rotates through these every ~5s so the
// splash shows variety. Each is a real reference photo from public/references.
// On a returning open with at least one saved generation, the hero locks to
// that user's most recent result instead — they see their own dog.
const SHOWCASE_STYLES = ['lion-cut', 'mohawk', '70s-rockstar']

export function Splash() {
  const generations = useStore(s => s.generations)
  const latest = generations[0] ?? null
  const [showcaseIdx, setShowcaseIdx] = useState(0)
  const [hint, setHint] = useState(0)

  useEffect(() => {
    if (latest) return
    const id = setInterval(() => setShowcaseIdx(n => (n + 1) % SHOWCASE_STYLES.length), 5400)
    return () => clearInterval(id)
  }, [latest])

  useEffect(() => {
    const id = setInterval(() => setHint(n => (n + 1) % HINTS.length), 3400)
    return () => clearInterval(id)
  }, [])

  const styleId = latest?.styleId ?? SHOWCASE_STYLES[showcaseIdx]
  const style = STYLES_BY_ID[styleId]
  const heroBefore = latest?.sourcePhoto ?? '/splash-before.jpg'
  const heroAfter = latest?.outputUrl ?? `/references/${style.referenceImage ?? `${styleId}.jpg`}`
  const watermark = !latest

  return (
    <div className="flex flex-col h-full y2k-bg relative">
      <span className="sparkle absolute top-16 left-6 text-rust" aria-hidden />
      <span className="sparkle absolute top-28 right-8 text-ember" aria-hidden style={{ animationDelay: '0.6s' }} />
      <span className="sparkle absolute bottom-40 right-12 text-ink/60" aria-hidden style={{ animationDelay: '1.2s' }} />
      <span className="sparkle absolute bottom-28 left-8 text-rust" aria-hidden style={{ animationDelay: '1.8s' }} />

      <div className="flex items-center justify-between px-5 pt-6 pb-3 relative">
        <Wordmark />
        <span className="chip text-[10px] uppercase tracking-widest">v0.1</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-5 text-center relative min-h-0">
        {/* Hero — single auto-playing morph. Keyed on styleId so swapping
            the showcase restarts the loop cleanly. */}
        <div
          key={styleId}
          className="relative w-full max-w-sm aspect-[4/5] rounded-[28px] overflow-hidden sticker isolate"
        >
          <div className="brand-halo" style={{ ['--brand' as never]: style.brand }} />
          <MorphVideo
            beforePhoto={heroBefore}
            afterUrl={heroAfter}
            style={style}
            watermark={watermark}
          />
        </div>

        {/* Returning-user signal (rare path: the app routes returning users
            straight to profile, but if they ever land here we welcome them). */}
        {latest && (
          <p className="mt-3 text-[11px] uppercase tracking-widest text-ink/55 flex items-center gap-1.5">
            <span className="sparkle" style={{ color: style.brand }} aria-hidden />
            welcome back · last look
          </p>
        )}

        <h1 className="font-display text-[34px] leading-[1.05] mt-5 tracking-tight">
          See the cut <span className="italic">before</span>
          <br />
          you book it.
        </h1>

        <p className="mt-2 text-sm text-ink/60 max-w-[30ch] h-9">
          {HINTS[hint]}
        </p>
      </div>

      <div className="px-5 pb-7 pt-3 flex flex-col gap-2 relative">
        <Button
          size="lg"
          className="chrome w-full"
          onClick={() => navigate(latest ? 'profile' : 'capture')}
        >
          <span className="sparkle text-cream" aria-hidden />
          {latest ? 'Open your dog' : 'Add your dog'}
          <span className="sparkle text-cream" aria-hidden style={{ animationDelay: '0.6s' }} />
        </Button>
        <p className="text-center text-[11px] text-ink/45">
          {latest
            ? 'Re-roll, save, share. You know the drill.'
            : 'One free re-roll. No card. No trial. No vibes-based pricing later.'}
        </p>
      </div>
    </div>
  )
}

const HINTS = [
  'For people who book grooming appointments and immediately spiral.',
  'Show up to the groomer with a screenshot, not a vague hand gesture.',
  'No, we are not also doing cats.',
  'Built for the dog. Hostile to the algorithm.',
]
