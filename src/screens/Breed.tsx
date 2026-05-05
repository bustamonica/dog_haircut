import { useMemo, useState } from 'react'
import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { BREEDS } from '../data/breeds'
import { back, getState, setState, startGeneration, useStore } from '../state/store'

export function Breed() {
  // App auto-detection guess: in MVP, we just default to Goldendoodle
  // (a top-volume breed). Per design doc, real version uses an on-device
  // detector; we surface the guess and let the user override.
  const dog = useStore(s => s.dog)
  const [breedId, setBreedId] = useState(dog?.breedId ?? 'goldendoodle')
  const [query, setQuery] = useState('')
  const [customName, setCustomName] = useState<string | null>(dog?.customBreedName ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return BREEDS
    return BREEDS.filter(b => b.name.toLowerCase().includes(q))
  }, [query])

  const trimmed = query.trim()
  const hasExactMatch = filtered.some(b => b.name.toLowerCase() === trimmed.toLowerCase())
  const showCustomSuggest = trimmed.length > 1 && !hasExactMatch

  const breed = BREEDS.find(b => b.id === breedId)!
  const displayName = customName ?? breed.name
  const displayHint = customName ? 'custom breed — auto-pick uses mixed coat defaults' : breed.coatHint

  const pickPreset = (id: string) => {
    setBreedId(id)
    setCustomName(null)
  }

  const pickCustom = () => {
    setCustomName(trimmed)
    setBreedId('mixed') // fall back to mixed for the auto-pick logic
  }

  const onContinue = () => {
    const cur = getState().dog
    if (!cur) return
    setState({
      dog: { ...cur, breedId, customBreedName: customName ?? undefined },
    })
    // Auto-pick the highest-wow style and start generating immediately —
    // first-run flow per the design doc: no browsing, no decision fatigue.
    const fallback = BREEDS.find(b => b.id === 'mixed')!
    const target = customName ? fallback : breed
    startGeneration(target.autoPickStyleId)
  }

  return (
    <ScreenContainer>
      <TopBar title="Breed check" left={<BackButton onClick={() => back()} />} />

      <Scroll className="px-5 pt-2 pb-6">
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-widest text-ink/45 mb-1">
            {customName ? 'Custom' : 'Auto-detected'}
          </p>
          <h2 className="font-display text-3xl tracking-tight">
            We think this is a <span className="italic">{displayName}</span>.
          </h2>
          <p className="text-sm text-ink/60 mt-1">{displayHint}. Tap to override if we're cooking.</p>
        </div>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search or type your dog's breed"
          className="w-full h-12 px-4 mt-4 rounded-xl bg-ink/5 outline-none focus:bg-ink/10 transition-colors text-sm"
        />

        <div className="grid grid-cols-1 gap-1.5 mt-3">
          {filtered.map(b => {
            const selected = !customName && breedId === b.id
            return (
              <button
                key={b.id}
                onClick={() => pickPreset(b.id)}
                className={`press flex items-center justify-between px-4 h-14 rounded-2xl text-left transition-colors ${
                  selected ? 'bg-ink text-cream' : 'bg-ink/5 text-ink hover:bg-ink/10'
                }`}
              >
                <div>
                  <div className="text-sm font-medium tracking-tight">{b.name}</div>
                  <div className={`text-[11px] ${selected ? 'text-cream/65' : 'text-ink/55'}`}>{b.coatHint}</div>
                </div>
                {selected && <Check />}
              </button>
            )
          })}

          {showCustomSuggest && (
            <button
              onClick={pickCustom}
              className={`press flex items-center justify-between px-4 h-14 rounded-2xl text-left transition-colors border-2 border-dashed ${
                customName === trimmed
                  ? 'bg-ink text-cream border-ink'
                  : 'bg-cream text-ink border-ink/15 hover:border-ink/35'
              }`}
            >
              <div>
                <div className="text-sm font-medium tracking-tight">Use "{trimmed}"</div>
                <div className={`text-[11px] ${customName === trimmed ? 'text-cream/65' : 'text-ink/55'}`}>
                  Custom breed · we'll use mixed-coat defaults
                </div>
              </div>
              {customName === trimmed && <Check />}
            </button>
          )}

          {filtered.length === 0 && !showCustomSuggest && (
            <p className="text-sm text-ink/50 px-1 py-3">No matches. Type a few more letters.</p>
          )}
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

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 9.5 7 13l8-8" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
