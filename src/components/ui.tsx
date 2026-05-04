import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'pro'
  size?: 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
}: ButtonProps) {
  const base =
    'press inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-full transition-shadow disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    md: 'h-11 px-5 text-sm',
    lg: 'h-14 px-6 text-base',
  }
  const variants = {
    primary: 'bg-ink text-cream hover:shadow-md',
    secondary: 'bg-ink/5 text-ink hover:bg-ink/10',
    ghost: 'bg-transparent text-ink hover:bg-ink/5',
    pro: 'bg-gradient-to-br from-ember to-rust text-cream hover:shadow-lg',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function TopBar({
  title,
  left,
  right,
  border = true,
}: {
  title?: ReactNode
  left?: ReactNode
  right?: ReactNode
  border?: boolean
}) {
  return (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-cream/90 backdrop-blur-md ${border ? 'border-b border-ink/5' : ''}`}
    >
      <div className="w-12 flex items-center">{left}</div>
      <div className="text-sm font-medium tracking-tight">{title}</div>
      <div className="w-12 flex items-center justify-end">{right}</div>
    </div>
  )
}

export function BackButton({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="press flex items-center justify-center h-9 w-9 rounded-full hover:bg-ink/5">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 4 6 10l6 6" stroke="#1A1815" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{ fontSize: size }}
      className="font-display italic tracking-tight leading-none"
    >
      coif
    </span>
  )
}

export function Wordmark({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <div className={`font-display italic text-2xl ${tone === 'dark' ? 'text-ink' : 'text-cream'}`}>
      coif<span className="not-italic align-baseline">.</span>
    </div>
  )
}

export function ScreenContainer({ children }: { children: ReactNode }) {
  return <div className="phone-frame flex flex-col">{children}</div>
}

export function Scroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>
}

export function ProBadge() {
  return (
    <span className="chip chip-dark text-[10px] uppercase tracking-widest">pro</span>
  )
}
