import { useState } from 'react'
import { BackButton, ScreenContainer, Scroll, TopBar, Button } from '../components/ui'
import { back, navigate, upgradeToPro } from '../state/store'

export function Paywall() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')

  const onPurchase = () => {
    upgradeToPro()
    navigate('profile')
  }

  return (
    <ScreenContainer>
      <TopBar title="" left={<BackButton onClick={() => back()} />} border={false} />

      <Scroll className="px-5 pt-2 pb-6">
        <h1 className="font-display text-[44px] leading-[1.05] tracking-tight">
          Coif <span className="italic">Pro</span>.
        </h1>
        <p className="text-sm text-ink/65 mt-2 max-w-[28ch]">
          One product. One price. No upsell ladder, no ads, no referral schemes from your dad's pyramid.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Plan
            label="Annual"
            price="$29.99/yr"
            sub="Works out to $2.50/mo. Saves 50%."
            selected={plan === 'annual'}
            onSelect={() => setPlan('annual')}
            badge="Best value"
          />
          <Plan
            label="Monthly"
            price="$4.99/mo"
            sub="Cancel any time. Even mid-cut."
            selected={plan === 'monthly'}
            onSelect={() => setPlan('monthly')}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-cream border border-ink/5 p-5">
          <p className="text-xs uppercase tracking-widest text-ink/45 mb-3">What's in it</p>
          <ul className="space-y-2.5">
            <Feature title="Unlimited re-rolls" sub="Free is one auto-pick. Pro re-rolls forever." />
            <Feature title="No watermark, higher res" sub="Your share, your face on it." />
            <Feature title='"Show this to my groomer" card' sub="Photo brief + the technical request, exportable." />
            <Feature title="Priority queue" sub="Sub-15s hot path." />
            <Feature title="Cinematic before/after" sub="Server-side video model. Shipping v1.5." pending />
          </ul>
        </div>

        <div className="mt-5 text-[11px] text-ink/45 leading-relaxed">
          No free trial. We'd rather you decide once. Auto-renews until cancelled. Manage in App Store / Settings.
        </div>
      </Scroll>

      <div className="px-5 pb-6 pt-3 border-t border-ink/5 bg-cream">
        <Button variant="pro" size="lg" className="w-full" onClick={onPurchase}>
          Start Pro — {plan === 'annual' ? '$29.99/yr' : '$4.99/mo'}
        </Button>
        <p className="text-center text-[10px] text-ink/40 mt-2 uppercase tracking-widest">
          No card capture in demo mode • Tap to simulate
        </p>
      </div>
    </ScreenContainer>
  )
}

function Plan({
  label,
  price,
  sub,
  selected,
  onSelect,
  badge,
}: {
  label: string
  price: string
  sub: string
  selected: boolean
  onSelect: () => void
  badge?: string
}) {
  return (
    <button
      onClick={onSelect}
      className={`press relative text-left rounded-2xl p-4 border-2 transition-colors ${
        selected ? 'border-ink bg-ink text-cream' : 'border-ink/10 bg-cream text-ink hover:bg-ink/5'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-65">{label}</div>
          <div className="font-display text-2xl mt-0.5">{price}</div>
        </div>
        <div className={`h-5 w-5 rounded-full border-2 ${selected ? 'border-cream bg-cream' : 'border-ink/30'}`}>
          {selected && <div className="m-1 h-2.5 w-2.5 rounded-full bg-ink" />}
        </div>
      </div>
      <div className={`text-[11px] mt-1 ${selected ? 'text-cream/65' : 'text-ink/55'}`}>{sub}</div>
      {badge && (
        <div className="absolute -top-2 right-3 chip chip-dark text-[10px] uppercase tracking-widest">{badge}</div>
      )}
    </button>
  )
}

function Feature({ title, sub, pending }: { title: string; sub: string; pending?: boolean }) {
  return (
    <li className="flex gap-3">
      <div className="mt-1 flex-shrink-0">
        {pending ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#1A1815" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="m3 8 3.5 3.5L13 5" stroke="#1A1815" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <div className="text-sm font-medium tracking-tight">
          {title}
          {pending && <span className="ml-2 text-[10px] uppercase tracking-widest text-ink/40">soon</span>}
        </div>
        <div className="text-xs text-ink/60">{sub}</div>
      </div>
    </li>
  )
}
