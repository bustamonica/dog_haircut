import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { back, reset, useStore } from '../state/store'

export function Settings() {
  const isPro = useStore(s => s.isPro)
  const dog = useStore(s => s.dog)
  return (
    <ScreenContainer>
      <TopBar title="Settings" left={<BackButton onClick={() => back()} />} />

      <Scroll className="px-5 pt-4 pb-6 space-y-4">
        <Section title="Subscription">
          <Row label="Plan" value={isPro ? 'Pro' : 'Free'} />
          <Row label="Renews" value={isPro ? 'May 2027' : '—'} />
        </Section>

        <Section title="Dog">
          <Row label="Breed" value={dog?.customBreedName ?? dog?.breedId ?? '—'} />
          <p className="text-[11px] text-ink/45 px-3 pb-3">
            One dog per account. Multi-dog support is on the list.
          </p>
        </Section>

        <Section title="Notifications">
          <Row label="Style drops" value="Monthly" />
          <Row label="Grooming reminder" value="Every 6 weeks" />
        </Section>

        <Section title="About">
          <Row label="Version" value="0.1.0 · build 4f2c" />
          <Row label="Brand voice" value="Internet-pilled" />
          <Row label="Cats" value="Not supported" />
        </Section>

        <div className="pt-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (confirm('Reset the demo? This wipes the dog profile and any generations.')) {
                reset()
              }
            }}
          >
            Reset demo
          </Button>
        </div>

        <p className="text-center text-[10px] text-ink/40 uppercase tracking-widest">
          No ads · No referrals · One product, one price
        </p>
      </Scroll>
    </ScreenContainer>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-cream border border-ink/5 overflow-hidden">
      <div className="px-3 pt-3 pb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-ink/45">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-t border-ink/5 first:border-t-0">
      <span className="text-sm text-ink/75">{label}</span>
      <span className="text-sm text-ink font-medium">{value}</span>
    </div>
  )
}
