import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { BottomNav } from './Library'
import { DogPortrait } from '../components/DogPortrait'
import { BREEDS } from '../data/breeds'
import { STYLES_BY_ID } from '../data/styles'
import { back, navigate, useStore } from '../state/store'

export function GroomerCard() {
  const dog = useStore(s => s.dog)
  const generations = useStore(s => s.generations)
  const isPro = useStore(s => s.isPro)
  const saved = generations.filter(g => g.savedToBoard)

  if (!dog) return null
  const breed = BREEDS.find(b => b.id === dog.breedId)

  return (
    <ScreenContainer>
      <TopBar
        title="Next appointment"
        left={<BackButton onClick={() => back()} />}
      />

      <Scroll className="px-5 pt-3 pb-4">
        <p className="text-sm text-ink/65 leading-snug mb-5">
          The board you bring to the groomer. Add the cut, hand them your phone, watch the misunderstanding evaporate.
        </p>

        {saved.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <BoardHeader dog={dog.name} breed={breed?.name ?? ''} />
            {saved.map((g, i) => {
              const style = STYLES_BY_ID[g.styleId]
              return (
                <div key={g.id} className="rounded-2xl overflow-hidden sticker bg-cream relative">
                  <div className="absolute -top-1 left-6 tape" />
                  <div className="absolute -top-1 right-10 tape rotate-3" />
                  <div className="grid grid-cols-2">
                    <div className="aspect-square overflow-hidden relative">
                      {g.sourcePhoto ? (
                        <img src={g.sourcePhoto} className="w-full h-full object-cover" alt="Before" />
                      ) : (
                        <DogPortrait baseline bgSeed={i + 12} />
                      )}
                      <div className="absolute top-2 left-2 chip">before</div>
                    </div>
                    <div className="aspect-square overflow-hidden relative border-l-2 border-cream">
                      <DogPortrait style={style} bgSeed={i + 13} />
                      <div className="absolute top-2 right-2 chip chip-dark">{style.name}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-display italic text-2xl tracking-tight mb-1">{style.name}</div>
                    <p className="text-sm text-ink/80 leading-relaxed">{style.description}</p>
                    <details className="mt-3">
                      <summary className="text-xs text-ink/55 cursor-pointer">Technical brief for groomer</summary>
                      <p className="mt-2 text-xs text-ink/70 font-mono leading-relaxed">{style.groomerBrief}</p>
                    </details>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isPro && saved.length > 0 && (
          <div className="mt-5 rounded-2xl bg-ink/5 p-4 text-center">
            <p className="text-xs text-ink/65">
              "Show this to my groomer" export is a Pro feature.
            </p>
            <Button variant="pro" className="mt-2" onClick={() => navigate('paywall')}>
              Unlock export
            </Button>
          </div>
        )}

        {isPro && saved.length > 0 && (
          <div className="mt-5">
            <Button className="w-full" onClick={() => alert('In a real build this exports a clean share card image / PDF for the groomer.')}>
              Export share card
            </Button>
          </div>
        )}
      </Scroll>

      <BottomNav />
    </ScreenContainer>
  )
}

function BoardHeader({ dog, breed }: { dog: string; breed: string }) {
  return (
    <div className="rounded-2xl bg-ink text-cream p-5 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-[0.07]" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-widest text-cream/60">For the groomer</p>
        <p className="font-display italic text-3xl mt-1">{dog}</p>
        <p className="text-sm text-cream/70 mt-0.5">{breed}</p>
        <p className="text-[11px] text-cream/55 mt-3 leading-relaxed max-w-[34ch]">
          Reference looks below. Ask before deviating. Your call on what's safe for the coat.
        </p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-ink/5 p-6 text-center">
      <p className="font-display italic text-2xl">Empty board.</p>
      <p className="text-xs text-ink/55 mt-1 leading-relaxed">
        Save a look from the result screen and it'll show up here.
      </p>
      <Button className="mt-4" variant="secondary" onClick={() => navigate('library')}>
        Browse styles
      </Button>
    </div>
  )
}
