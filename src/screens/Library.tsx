import { useMemo, useState } from 'react'
import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { DogPortrait } from '../components/DogPortrait'
import { STYLES } from '../data/styles'
import type { StyleCategory } from '../data/styles'
import { back, navigate, startGeneration, useStore } from '../state/store'

const TABS: { id: StyleCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'groomer-real', label: 'Groomer cuts' },
  { id: 'fun', label: 'Fun' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'designer', label: 'Designer drops' },
]

export function Library() {
  const isPro = useStore(s => s.isPro)
  const [tab, setTab] = useState<StyleCategory | 'all'>('all')

  const list = useMemo(() => {
    return tab === 'all' ? STYLES : STYLES.filter(s => s.category === tab)
  }, [tab])

  return (
    <ScreenContainer>
      <TopBar
        title="Style library"
        left={<BackButton onClick={() => back()} />}
        right={!isPro && <span className="chip chip-dark text-[10px] uppercase tracking-widest">pro</span>}
      />

      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto no-scrollbar border-b border-ink/5 bg-cream sticky top-12 z-10">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`press whitespace-nowrap h-8 px-3 rounded-full text-xs font-medium tracking-tight ${
              tab === t.id ? 'bg-ink text-cream' : 'bg-ink/5 text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Scroll className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {list.map((style, i) => {
            const locked = !isPro && style.pro
            return (
              <button
                key={style.id}
                onClick={() => {
                  if (locked) {
                    navigate('paywall')
                    return
                  }
                  if (!isPro) {
                    // even for free styles, free user has consumed their gen
                    navigate('paywall')
                    return
                  }
                  startGeneration(style.id)
                }}
                className="press text-left bg-cream rounded-2xl overflow-hidden sticker"
              >
                <div className="relative aspect-square overflow-hidden">
                  <DogPortrait style={style} bgSeed={i + 1} />
                  {locked && (
                    <div className="absolute inset-0 bg-ink/55 flex items-center justify-center">
                      <div className="text-cream text-center">
                        <LockIcon />
                        <div className="text-[10px] uppercase tracking-widest mt-1">Pro</div>
                      </div>
                    </div>
                  )}
                  {style.category === 'designer' && (
                    <div className="absolute top-2 left-2 chip chip-dark text-[10px] uppercase tracking-widest">
                      designer
                    </div>
                  )}
                  {style.category === 'seasonal' && (
                    <div className="absolute top-2 left-2 chip text-[10px] uppercase tracking-widest" style={{ background: '#FFE9A8' }}>
                      drop
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-sm font-medium tracking-tight">{style.name}</div>
                  <div className="text-[11px] text-ink/55 line-clamp-1">{style.blurb}</div>
                </div>
              </button>
            )
          })}
        </div>

        {!isPro && (
          <div className="mt-6 rounded-2xl bg-ink p-5 text-cream">
            <p className="font-display italic text-2xl">Want more than one?</p>
            <p className="text-xs text-cream/75 mt-1 leading-relaxed">
              Pro unlocks the whole library, drops the watermark, and skips the queue. $4.99/mo or $29.99/yr.
            </p>
            <Button variant="pro" className="w-full mt-3" onClick={() => navigate('paywall')}>
              Go Pro
            </Button>
          </div>
        )}
      </Scroll>

      <BottomNav />
    </ScreenContainer>
  )
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="mx-auto">
      <rect x="4" y="9.5" width="14" height="9" rx="2" fill="#FAF6EE" />
      <path d="M7 9.5V7a4 4 0 1 1 8 0v2.5" stroke="#FAF6EE" strokeWidth="2" />
    </svg>
  )
}

export function BottomNav() {
  const screen = useStore(s => s.screen)
  return (
    <div className="border-t border-ink/5 bg-cream/90 backdrop-blur-md grid grid-cols-3 h-14">
      <NavBtn
        active={screen === 'profile'}
        onClick={() => navigate('profile')}
        label="Dog"
        icon={<PawIcon />}
      />
      <NavBtn
        active={screen === 'library'}
        onClick={() => navigate('library')}
        label="Styles"
        icon={<GridIcon />}
      />
      <NavBtn
        active={screen === 'groomer-card'}
        onClick={() => navigate('groomer-card')}
        label="Board"
        icon={<BoardIcon />}
      />
    </div>
  )
}

function NavBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`press flex flex-col items-center justify-center gap-0.5 ${active ? 'text-ink' : 'text-ink/45'}`}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  )
}

function PawIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="6" cy="7" rx="2" ry="2.6" fill="currentColor" />
      <ellipse cx="14" cy="7" rx="2" ry="2.6" fill="currentColor" />
      <ellipse cx="3" cy="11" rx="1.7" ry="2.2" fill="currentColor" />
      <ellipse cx="17" cy="11" rx="1.7" ry="2.2" fill="currentColor" />
      <path d="M10 10c-3 0-5.5 2-5.5 4.2C4.5 16.4 6 17 7 17c1.2 0 2-1 3-1s1.8 1 3 1c1 0 2.5-.6 2.5-2.8C15.5 12 13 10 10 10Z" fill="currentColor" />
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="6" height="6" rx="1.4" fill="currentColor" />
      <rect x="11" y="3" width="6" height="6" rx="1.4" fill="currentColor" />
      <rect x="3" y="11" width="6" height="6" rx="1.4" fill="currentColor" />
      <rect x="11" y="11" width="6" height="6" rx="1.4" fill="currentColor" />
    </svg>
  )
}
function BoardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 1.5v3M14 1.5v3M3.5 8h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
