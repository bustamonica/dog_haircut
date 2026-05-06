import { useState } from 'react'
import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { MorphVideo } from '../components/MorphVideo'
import { DogPortrait } from '../components/DogPortrait'
import { StyledPhoto } from '../components/StyledPhoto'
import { STYLES_BY_ID, pickWowStyle } from '../data/styles'
import { back, navigate, startGeneration, toggleSave, useStore } from '../state/store'
import { ShareSheet } from '../components/ShareSheet'

export function Result() {
  const activeId = useStore(s => s.activeGenerationId)
  const generations = useStore(s => s.generations)
  const isPro = useStore(s => s.isPro)
  const freeGenUsed = useStore(s => s.freeGenUsed)
  const gen = generations.find(g => g.id === activeId)
  const [view, setView] = useState<'morph' | 'compare'>('morph')
  const [showShare, setShowShare] = useState(false)

  if (!gen) return null
  const style = STYLES_BY_ID[gen.styleId]
  const beforePhoto = gen.sourcePhoto

  const onReroll = () => {
    if (!isPro) {
      navigate('paywall')
      return
    }
    const seen = generations.map(g => g.styleId)
    startGeneration(pickWowStyle(seen).id)
  }

  return (
    <ScreenContainer>
      <TopBar
        title="Result"
        left={<BackButton onClick={() => back()} />}
        right={
          <button
            onClick={() => navigate('settings')}
            className="press flex items-center justify-center h-9 w-9 rounded-full hover:bg-ink/5"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.4" stroke="#1A1815" strokeWidth="1.5" />
              <path d="M9 1.5v1.8M9 14.7v1.8M16.5 9h-1.8M3.3 9H1.5M14.3 3.7l-1.3 1.3M5 13l-1.3 1.3M14.3 14.3 13 13M5 5 3.7 3.7" stroke="#1A1815" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        }
      />

      <Scroll className="px-5 pt-3 pb-24">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display italic text-2xl tracking-tight">{style.name}</span>
          {style.pro && <span className="chip chip-dark text-[10px] uppercase tracking-widest">pro</span>}
        </div>
        <p className="text-sm text-ink/65 leading-snug mb-4">{style.blurb}</p>

        <div className="aspect-[4/5] w-full sticker mb-3 relative overflow-hidden rounded-3xl">
          {view === 'morph' ? (
            <MorphVideo
              beforePhoto={beforePhoto}
              afterUrl={gen.outputUrl}
              style={style}
              watermark={gen.watermarked}
            />
          ) : (
            <CompareView
              beforePhoto={beforePhoto}
              afterUrl={gen.outputUrl}
              style={style}
              watermark={gen.watermarked}
            />
          )}
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setView('morph')}
            className={`press flex-1 h-10 text-xs font-medium rounded-full ${
              view === 'morph' ? 'bg-ink text-cream' : 'bg-ink/5 text-ink'
            }`}
          >
            Before / after video
          </button>
          <button
            onClick={() => setView('compare')}
            className={`press flex-1 h-10 text-xs font-medium rounded-full ${
              view === 'compare' ? 'bg-ink text-cream' : 'bg-ink/5 text-ink'
            }`}
          >
            Side-by-side
          </button>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream p-4 mb-4">
          <p className="text-[11px] uppercase tracking-widest text-ink/45 mb-2">What you'll ask the groomer for</p>
          <p className="text-sm leading-relaxed text-ink/85">{style.description}</p>
          <details className="mt-3">
            <summary className="text-xs text-ink/55 cursor-pointer">Show technical brief</summary>
            <p className="mt-2 text-xs text-ink/70 font-mono leading-relaxed">
              {style.groomerBrief}
            </p>
          </details>
          {gen.prompt && <PromptDetails prompt={gen.prompt} />}
        </div>

        {/* Quality micro-survey */}
        <Survey />

        {!isPro && (
          <div className="mt-4 rounded-2xl bg-ink p-4 text-cream">
            <div className="flex items-center justify-between mb-1">
              <p className="font-display italic text-xl">Want another?</p>
              <span className="chip text-[10px] uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.12)', color: '#FAF6EE' }}>pro</span>
            </div>
            <p className="text-xs text-cream/75 leading-relaxed mb-3">
              Free is one auto-pick. Pro re-rolls forever, drops the watermark, exports a groomer card. $4.99/mo.
            </p>
            <Button variant="pro" className="w-full" onClick={() => navigate('paywall')}>
              See Pro — $4.99/mo
            </Button>
          </div>
        )}
      </Scroll>

      {/* Sticky action bar */}
      <div className="px-5 pb-6 pt-3 border-t border-ink/5 bg-cream flex flex-col gap-2">
        <Button
          variant="pro"
          className="w-full"
          onClick={onReroll}
        >
          <RerollIcon /> {isPro ? 'Re-roll the look' : 'Re-roll · Pro'}
        </Button>
        <div className="flex gap-2">
          <Button
            variant={gen.savedToBoard ? 'primary' : 'secondary'}
            className="flex-1"
            onClick={() => {
              if (!isPro && freeGenUsed) {
                navigate('paywall')
                return
              }
              toggleSave(gen.id)
            }}
          >
            {gen.savedToBoard ? '✓ Saved' : 'Save to Board'}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowShare(true)}
          >
            <ShareIcon /> Share
          </Button>
        </div>
      </div>

      {showShare && (
        <ShareSheet
          onClose={() => setShowShare(false)}
          beforePhoto={beforePhoto}
          style={style}
          watermark={gen.watermarked}
        />
      )}
    </ScreenContainer>
  )
}

function PromptDetails({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // clipboard may be blocked on insecure origins (LAN HTTP); silent
    }
  }
  return (
    <details className="mt-3">
      <summary className="text-xs text-ink/55 cursor-pointer">Show prompt sent to model</summary>
      <div className="mt-2 rounded-lg bg-ink/5 p-3">
        <p className="text-xs text-ink/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
          {prompt}
        </p>
        <button
          onClick={onCopy}
          className="press mt-2 text-[11px] uppercase tracking-widest text-ink/55 hover:text-ink"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </details>
  )
}

function Survey() {
  const [picked, setPicked] = useState<'love' | 'pass' | null>(null)
  return (
    <div className="rounded-2xl bg-cream border border-ink/5 p-4">
      <p className="text-xs font-semibold tracking-tight mb-2">Like this look?</p>
      <div className="grid grid-cols-2 gap-2">
        {(['love', 'pass'] as const).map(v => (
          <button
            key={v}
            onClick={() => setPicked(v)}
            className={`press h-10 rounded-full text-xs font-medium ${
              picked === v ? 'bg-ink text-cream' : 'bg-ink/5 text-ink'
            }`}
          >
            {v === 'love' ? 'Love it' : 'Pass'}
          </button>
        ))}
      </div>
      {picked === 'pass' && (
        <p className="text-[11px] text-ink/55 mt-2">Noted. We'll bias away from this style for your dog next time.</p>
      )}
    </div>
  )
}

function CompareView({
  beforePhoto,
  afterUrl,
  style,
  watermark,
}: {
  beforePhoto: string | null
  afterUrl: string | null
  style: import('../data/styles').Style
  watermark: boolean
}) {
  return (
    <div className="grid grid-rows-2 h-full">
      <div className="relative overflow-hidden">
        {beforePhoto ? (
          <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
        ) : (
          <DogPortrait baseline bgSeed={5} />
        )}
        <div className="absolute top-2 left-2 chip">before</div>
      </div>
      <div className="relative overflow-hidden border-t-2 border-cream">
        {afterUrl ? (
          <img src={afterUrl} alt={`After: ${style.name}`} className="w-full h-full object-cover" />
        ) : beforePhoto ? (
          <StyledPhoto src={beforePhoto} style={style} />
        ) : (
          <DogPortrait style={style} bgSeed={6} />
        )}
        <div className="absolute top-2 right-2 chip chip-dark">{style.name}</div>
        {watermark && <div className="watermark">made with coif</div>}
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5v8.5M5.5 4 8 1.5 10.5 4M3 8.5v4a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5v-4" stroke="#1A1815" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RerollIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 6a5 5 0 0 1 9-2M13 10a5 5 0 0 1-9 2" stroke="#FAF6EE" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 1.5V4h-2.5M4 14.5V12h2.5" stroke="#FAF6EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
