import { BackButton, ScreenContainer, Scroll, TopBar, Button } from '../components/ui'
import { BottomNav } from '../components/BottomNav'
import { DogPortrait } from '../components/DogPortrait'
import { STYLES_BY_ID, pickWowStyle } from '../data/styles'
import { back, navigate, setState, startGeneration, useStore } from '../state/store'
import { StyledPhoto } from '../components/StyledPhoto'

export function Profile() {
  const dog = useStore(s => s.dog)
  const generations = useStore(s => s.generations)
  const isPro = useStore(s => s.isPro)

  if (!dog) return null

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
        title=""
        left={<BackButton onClick={() => back()} />}
        right={
          <button onClick={() => navigate('settings')} className="press text-xs text-ink/55 px-2">Settings</button>
        }
      />

      <Scroll className="px-5 pt-2 pb-2">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-ink/5 sticker shrink-0">
            {dog.photo && dog.photo !== '__demo__' ? (
              <img src={dog.photo} className="w-full h-full object-cover" alt="Dog" />
            ) : (
              <DogPortrait baseline bgSeed={1} />
            )}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="font-display text-3xl tracking-tight">Your dog</h1>
            <div className="flex items-center gap-1.5 mt-2">
              {isPro ? (
                <span className="chip chip-dark text-[10px] uppercase tracking-widest">pro</span>
              ) : (
                <span className="chip text-[10px] uppercase tracking-widest">free</span>
              )}
              <span className="chip text-[10px] uppercase tracking-widest">{generations.length} look{generations.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="primary" onClick={onReroll}>
            {isPro ? 'Re-roll' : 'Re-roll · Pro'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('groomer-card')}>
            Groomer card
          </Button>
        </div>

        <h2 className="text-[11px] uppercase tracking-widest text-ink/45 mt-8 mb-3">Generations</h2>
        {generations.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing yet — tap re-roll above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {generations.map((g, i) => {
              const style = STYLES_BY_ID[g.styleId]
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setState({ activeGenerationId: g.id })
                    navigate('result')
                  }}
                  className="press text-left bg-cream rounded-2xl overflow-hidden sticker"
                >
                  <div className="aspect-square overflow-hidden relative">
                    {g.outputUrl ? (
                      <img src={g.outputUrl} alt={style.name} className="w-full h-full object-cover" />
                    ) : g.sourcePhoto ? (
                      <StyledPhoto src={g.sourcePhoto} style={style} />
                    ) : (
                      <DogPortrait style={style} bgSeed={i + 8} />
                    )}
                    {g.savedToBoard && (
                      <div className="absolute top-2 right-2 chip chip-dark text-[10px]">on board</div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-sm font-medium tracking-tight">{style.name}</div>
                    <div className="text-[11px] text-ink/55">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Scroll>

      <BottomNav />
    </ScreenContainer>
  )
}
