import { useState } from 'react'
import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { BREEDS } from '../data/breeds'
import { back, getState, setState, startGeneration, useStore } from '../state/store'

export function Breed() {
  // App auto-detection guess: in MVP, we just default to Goldendoodle.
  // Per design doc, real version uses an on-device detector; here we show
  // a single guess and let the user override with free text if it's wrong.
  const dog = useStore(s => s.dog)
  const [breedId, setBreedId] = useState(dog?.breedId ?? 'goldendoodle')
  const [customName, setCustomName] = useState<string | null>(dog?.customBreedName ?? null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(customName ?? '')

  const breed = BREEDS.find(b => b.id === breedId)!
  const displayName = customName ?? breed.name
  const displayHint = customName ? 'custom breed — auto-pick uses mixed coat defaults' : breed.coatHint

  const saveOverride = () => {
    const v = draft.trim()
    if (!v) return
    setCustomName(v)
    setBreedId('mixed') // mixed-coat defaults for auto-pick logic
    setEditing(false)
  }

  const reset = () => {
    setCustomName(null)
    setBreedId('goldendoodle')
    setDraft('')
    setEditing(false)
  }

  const onContinue = () => {
    const cur = getState().dog
    if (!cur) return
    setState({ dog: { ...cur, breedId, customBreedName: customName ?? undefined } })
    const fallback = BREEDS.find(b => b.id === 'mixed')!
    const target = customName ? fallback : breed
    startGeneration(target.autoPickStyleId)
  }

  return (
    <ScreenContainer>
      <TopBar title="Breed check" left={<BackButton onClick={() => back()} />} />

      <Scroll className="px-5 pt-6 pb-6">
        <p className="text-[11px] uppercase tracking-widest text-ink/45 mb-1">
          {customName ? 'Custom' : 'Auto-detected'}
        </p>
        <h2 className="font-display text-[40px] leading-[1.05] tracking-tight">
          We think this is a <span className="italic">{displayName}</span>.
        </h2>
        <p className="text-sm text-ink/60 mt-2">{displayHint}.</p>

        {!editing ? (
          <div className="mt-8 flex flex-col gap-2">
            <button
              onClick={() => {
                setDraft(customName ?? '')
                setEditing(true)
              }}
              className="press text-sm text-ink/65 hover:text-ink underline underline-offset-4 self-start"
            >
              Not quite? Enter your dog's breed →
            </button>
            {customName && (
              <button
                onClick={reset}
                className="press text-xs text-ink/45 hover:text-ink/70 self-start"
              >
                Clear override
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-cream border border-ink/10 p-4">
            <label className="block text-[11px] uppercase tracking-widest text-ink/45 mb-2">
              Your dog's breed
            </label>
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveOverride()
                if (e.key === 'Escape') setEditing(false)
              }}
              placeholder="e.g. Cavapoo, Border Collie mix, Xolo"
              className="w-full h-12 px-4 rounded-xl bg-ink/5 outline-none focus:bg-ink/10 transition-colors text-sm"
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={saveOverride} disabled={!draft.trim()}>
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-cream border border-ink/5 p-4">
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
