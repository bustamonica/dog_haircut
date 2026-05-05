import type { Style } from '../data/styles'
import { MorphVideo } from './MorphVideo'

type Props = {
  onClose: () => void
  beforePhoto: string | null
  style: Style
  watermark: boolean
}

const TARGETS: { id: string; label: string; sub?: string; icon: React.ReactNode }[] = [
  { id: 'tiktok', label: 'TikTok', sub: '9:16, scored', icon: <Glyph>tt</Glyph> },
  { id: 'reels', label: 'Reels', sub: '9:16', icon: <Glyph>ig</Glyph> },
  { id: 'stories', label: 'Stories', sub: '9:16', icon: <Glyph>st</Glyph> },
  { id: 'imessage', label: 'iMessage', sub: 'square', icon: <Glyph>iM</Glyph> },
  { id: 'save', label: 'Save', sub: 'to Photos', icon: <Glyph>↓</Glyph> },
  { id: 'link', label: 'Copy link', sub: 'open.coif/abc123', icon: <Glyph>⌗</Glyph> },
]

export function ShareSheet({ onClose, beforePhoto, style, watermark }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end animate-fade-up" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <button onClick={onClose} className="absolute inset-0" aria-label="Close" />
      <div className="relative bg-cream rounded-t-3xl p-5 pt-3">
        <div className="flex justify-center pb-3">
          <div className="w-12 h-1.5 rounded-full bg-ink/15" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="font-display italic text-2xl tracking-tight">Share</p>
          <button onClick={onClose} className="press text-xs text-ink/55 px-2 h-8">Close</button>
        </div>

        <div className="grid grid-cols-[112px_1fr] gap-3 items-stretch mb-4">
          <div className="aspect-[9/16] rounded-2xl overflow-hidden sticker">
            <MorphVideo
              beforePhoto={beforePhoto}
              style={style}
              watermark={watermark}
              rounded={false}
            />
          </div>
          <div className="bg-ink/5 rounded-2xl p-3 flex flex-col justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-ink/45">Caption draft</p>
              <p className="text-sm leading-snug mt-1">
                my dog as a {style.name.toLowerCase()}. {style.blurb.toLowerCase()} no notes.
              </p>
            </div>
            <p className="text-[10px] text-ink/45 uppercase tracking-widest mt-2">
              {watermark ? 'free tier · watermarked' : 'pro · no watermark'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {TARGETS.map(t => (
            <button
              key={t.id}
              onClick={() => {
                onClose()
                // Real build hooks into the OS share sheet / platform SDK.
              }}
              className="press flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-cream border border-ink/10 hover:bg-ink/5"
            >
              <div className="h-10 w-10 rounded-full bg-ink text-cream flex items-center justify-center font-display italic text-sm">
                {t.icon}
              </div>
              <div className="text-xs font-medium tracking-tight">{t.label}</div>
              {t.sub && <div className="text-[10px] text-ink/45">{t.sub}</div>}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-ink/45 text-center uppercase tracking-widest">
          OS share sheet stubbed for the demo
        </p>
      </div>
    </div>
  )
}

function Glyph({ children }: { children: React.ReactNode }) {
  return <span className="text-xs leading-none">{children}</span>
}
