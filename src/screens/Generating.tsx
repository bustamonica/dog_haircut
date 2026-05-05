import { useEffect, useState } from 'react'
import { ScreenContainer, Wordmark } from '../components/ui'
import { DogPortrait } from '../components/DogPortrait'
import { StyledPhoto } from '../components/StyledPhoto'
import { STYLES_BY_ID } from '../data/styles'
import { finishGeneration, getState, useStore } from '../state/store'
import { REAL_GENERATION_ENABLED, generateImage } from '../services/generate'

const STAGES = [
  'Reading the photo',
  'Holding the dog still in latent space',
  'Locking face identity',
  'Applying ControlNet pose',
  'Sculpting coat',
  'QC pass',
]

export function Generating() {
  const styleId = useStore(s => s.pendingStyleId)
  const dog = useStore(s => s.dog)
  const isPro = useStore(s => s.isPro)
  const freeGenUsed = useStore(s => s.freeGenUsed)
  const style = styleId ? STYLES_BY_ID[styleId] : null
  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [statusNote, setStatusNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const photo = dog?.photo === '__demo__' ? null : dog?.photo ?? null
    const realPath = REAL_GENERATION_ENABLED && !!photo && !!style

    // Progress animation. With the real path we cap at ~92% until the
    // network call lands, then snap to 100. Mock path runs the full bar
    // over ~6s.
    const targetCap = realPath ? 92 : 100
    const tickRate = realPath ? 360 : 240
    const tickStep = realPath ? 1.4 : 3.5

    const interval = setInterval(() => {
      setProgress(p => {
        if (cancelled) return p
        const next = Math.min(targetCap, p + tickStep + Math.random() * 1.5)
        return next
      })
    }, tickRate)

    const stageInterval = setInterval(() => {
      setStageIdx(i => Math.min(STAGES.length - 1, i + 1))
    }, 950)

    let mockTimer: ReturnType<typeof setTimeout> | null = null

    if (realPath && photo && style && dog) {
      ;(async () => {
        const res = await generateImage({
          photo,
          style,
          breedId: dog.breedId,
          customBreedName: dog.customBreedName,
          signal: controller.signal,
        })
        if (cancelled) return

        if (res.ok) {
          setProgress(100)
          finishGeneration({
            sourcePhoto: photo,
            outputUrl: res.outputUrl,
            markFreeUsed: !isPro && !freeGenUsed,
          })
        } else {
          // Honest fallback — still ship a result, just using the
          // CSS-filter stand-in. Surface why for the developer.
          // eslint-disable-next-line no-console
          console.warn('[coif] real generation failed, falling back:', res.reason)
          setStatusNote(`Inference failed (${res.reason.slice(0, 80)}). Using stylized fallback.`)
          setProgress(100)
          finishGeneration({
            sourcePhoto: photo,
            outputUrl: null,
            markFreeUsed: !isPro && !freeGenUsed,
          })
        }
      })()
    } else {
      // Mock path: ~6s, no real network.
      mockTimer = setTimeout(() => {
        if (cancelled) return
        finishGeneration({
          sourcePhoto: photo,
          outputUrl: null,
          markFreeUsed: !isPro && !freeGenUsed,
        })
      }, 6000)
    }

    return () => {
      cancelled = true
      controller.abort()
      clearInterval(interval)
      clearInterval(stageInterval)
      if (mockTimer) clearTimeout(mockTimer)
    }
  }, [dog, isPro, freeGenUsed, style])

  if (!style) {
    return (
      <ScreenContainer>
        <div className="flex-1 flex items-center justify-center text-sm text-ink/45">No style queued.</div>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <div className="flex flex-col h-full bg-bone">
        <div className="flex items-center justify-between px-5 pt-6">
          <Wordmark />
          {getState().isPro && <span className="chip chip-dark text-[10px] uppercase tracking-widest">priority queue</span>}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-full max-w-xs aspect-square rounded-3xl overflow-hidden sticker grain">
            <div className="absolute inset-0 morph-stack">
              {dog?.photo && dog.photo !== '__demo__' ? (
                <img src={dog.photo} alt="Your dog" />
              ) : (
                <DogPortrait baseline bgSeed={3} />
              )}
              <div style={{ opacity: progress / 100, transition: 'opacity 240ms linear' }}>
                {dog?.photo && dog.photo !== '__demo__' ? (
                  <StyledPhoto src={dog.photo} style={style} />
                ) : (
                  <DogPortrait style={style} bgSeed={4} />
                )}
              </div>
              <div
                className="absolute inset-x-0 h-[3px] bg-ember/80"
                style={{
                  top: `${progress}%`,
                  boxShadow: '0 0 24px 6px rgba(226,89,44,0.55)',
                  transition: 'top 240ms linear',
                }}
              />
            </div>
          </div>

          <h1 className="font-display text-3xl mt-8 tracking-tight">
            Working on a <span className="italic">{style.name}</span>.
          </h1>
          <p className="text-sm text-ink/60 mt-2 max-w-xs">{style.blurb}</p>

          <div className="mt-8 w-full max-w-xs">
            <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
              <div className="bar-fill h-full" style={{ width: `${progress}%`, transition: 'width 240ms linear' }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-ink/55 uppercase tracking-widest">
              <span>{STAGES[stageIdx]}</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 pt-4 text-center">
          <p className="text-[11px] text-ink/45">
            {REAL_GENERATION_ENABLED
              ? 'Live edit via FLUX Kontext on Replicate.'
              : 'Median hot-path target: under 15 seconds.'}
            {!getState().isPro && ' Pro skips the queue.'}
          </p>
          {statusNote && (
            <p className="text-[10px] text-rust mt-1 max-w-xs mx-auto leading-snug">{statusNote}</p>
          )}
        </div>
      </div>
    </ScreenContainer>
  )
}
