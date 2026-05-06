import { navigate, useStore } from '../state/store'

export function BottomNav() {
  const screen = useStore(s => s.screen)
  return (
    <div className="border-t border-ink/5 bg-cream/90 backdrop-blur-md grid grid-cols-2 h-14">
      <NavBtn
        active={screen === 'profile'}
        onClick={() => navigate('profile')}
        label="Dog"
        icon={<PawIcon />}
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

function BoardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 1.5v3M14 1.5v3M3.5 8h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
