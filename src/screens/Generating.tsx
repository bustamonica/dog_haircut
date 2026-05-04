import { useEffect, useState } from 'react'
import { ScreenContainer, Wordmark } from '../components/ui'
import { DogPortrait } from '../components/DogPortrait'
import { STYLES_BY_ID } from '../data/styles'
import { finishGeneration, getState, useStore } from '../state/store'

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

  useEffect(() => {
    let cancelled = false

    const tick = () => {
      setProgress(p => {
        if (cancelled) return p
        const next = Math.min(100, p + (3 + Math.random() * 4))
        return next
      })
    }
    const interval = setInterval(tick, 240)

    const stageInterval = setInterval(() => {
      setStageIdx(i => Math.min(STAGES.length - 1, i + 1))
    }, 850)

    // ~6s simulated generation. Real pipeline target is sub-15s.
    const timer = setTimeout(() => {
      const photo = dog?.photo === '__demo__' ? null : dog?.photo ?? null
      finishGeneration({
        sourcePhoto: photo,
        markFreeUsed: !isPro && !freeGenUsed,
      })
    }, 6000)

    return () => {
      cancelled = true
      clearInterval(interval)
      clearInterval(stageInterval)
      clearTimeout(timer)
    }
  }, [dog, isPro, freeGenUsed])

  if (!style) {
    // Defensive — shouldn't happen via normal nav.
    return (
      <ScreenContainer>
        <div className="flex-1 flex items-center justify-center text-sm text-ink/45">No style queued.</div>
      </ScreenContainer>
    )
  }

  // Hot-path target sub-15s; show priority queue copy if Pro.
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
              {/* Before */}
              {dog?.photo && dog.photo !== '__demo__' ? (
                <img src={dog.photo} alt="Your dog" />
              ) : (
                <DogPortrait baseline bgSeed={3} />
              )}
              {/* After (fades in over time) */}
              <div style={{ opacity: progress / 100, transition: 'opacity 240ms linear' }}>
                <DogPortrait style={style} bgSeed={4} />
              </div>
              {/* Scan line */}
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
            Median hot-path target: under 15 seconds.
            {!getState().isPro && ' Pro skips the queue.'}
          </p>
        </div>
      </div>
    </ScreenContainer>
  )
}
