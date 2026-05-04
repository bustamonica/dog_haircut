import { useState } from 'react'
import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { BREEDS } from '../data/breeds'
import { back, getState, setState, startGeneration, useStore } from '../state/store'

export function Breed() {
  // App auto-detection guess: in MVP, we just default to Goldendoodle
  // (a top-volume breed). Per design doc, real version uses an on-device
  // detector; we surface the guess and let the user override.
  const dog = useStore(s => s.dog)
  const [breedId, setBreedId] = useState(dog?.breedId ?? 'goldendoodle')
  const breed = BREEDS.find(b => b.id === breedId)!

  const onContinue = () => {
    const cur = getState().dog
    if (!cur) return
    setState({
      dog: { ...cur, breedId },
    })
    // Auto-pick the highest-wow style and start generating immediately —
    // first-run flow per the design doc: no browsing, no decision fatigue.
    startGeneration(breed.autoPickStyleId)
  }

  return (
    <ScreenContainer>
      <TopBar title="Breed check" left={<BackButton onClick={() => back()} />} />

      <Scroll className="px-5 pt-2 pb-6">
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-widest text-ink/45 mb-1">Auto-detected</p>
          <h2 className="font-display text-3xl tracking-tight">
            We think this is a <span className="italic">{breed.name}</span>.
          </h2>
          <p className="text-sm text-ink/60 mt-1">{breed.coatHint}. Tap to override if we're cooking.</p>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mt-4">
          {BREEDS.map(b => (
            <button
              key={b.id}
              onClick={() => setBreedId(b.id)}
              className={`press flex items-center justify-between px-4 h-14 rounded-2xl text-left transition-colors ${
                breedId === b.id ? 'bg-ink text-cream' : 'bg-ink/5 text-ink hover:bg-ink/10'
              }`}
            >
              <div>
                <div className="text-sm font-medium tracking-tight">{b.name}</div>
                <div className={`text-[11px] ${breedId === b.id ? 'text-cream/65' : 'text-ink/55'}`}>{b.coatHint}</div>
              </div>
              {breedId === b.id && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9.5 7 13l8-8" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-cream border border-ink/5 p-4">
          <p className="text-xs font-semibold tracking-tight mb-1">Next: one free generation.</p>
          <p className="text-xs text-ink/65 leading-relaxed">
            We pick the style. We pick the wow. You don't have to decide. After, you can browse the library — that part's Pro.
          </p>
        </div>
      </Scroll>

      <div className="px-5 pb-6 pt-3 border-t border-ink/5 bg-cream">
        <Button size="lg" className="w-full" onClick={onContinue}>
          Generate first look →
        </Button>
      </div>
    </ScreenContainer>
  )
}
