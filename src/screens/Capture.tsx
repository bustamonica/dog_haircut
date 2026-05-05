import { useRef, useState } from 'react'
import { BackButton, Button, ScreenContainer, Scroll, TopBar } from '../components/ui'
import { DogPortrait } from '../components/DogPortrait'
import { back, navigate, setState } from '../state/store'

export function Capture() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const useDemoDog = () => {
    setPreview('__demo__')
  }

  const onContinue = () => {
    setState({
      dog: {
        breedId: 'goldendoodle', // tentative; user picks on next screen
        photo: preview,
        createdAt: Date.now(),
      },
    })
    navigate('breed')
  }

  return (
    <ScreenContainer>
      <TopBar
        title="Add your dog"
        left={<BackButton onClick={() => back()} />}
      />

      <Scroll className="px-5 pt-4 pb-6">
        <p className="text-sm text-ink/70 leading-snug mb-5">
          Full-body or face works. Daylight. Try not to make them look like a
          sad ottoman.
        </p>

        <div className="aspect-square w-full rounded-3xl overflow-hidden bg-ink/5 sticker mb-5 relative grain">
          {preview === '__demo__' ? (
            <DogPortrait baseline bgSeed={2} />
          ) : preview ? (
            <img src={preview} alt="Your dog" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-ink/35 dot-pattern">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="6" y="14" width="44" height="32" rx="6" stroke="#1A1815" strokeWidth="2" opacity="0.35" />
                <circle cx="28" cy="30" r="9" stroke="#1A1815" strokeWidth="2" opacity="0.35" />
                <circle cx="40" cy="22" r="2" fill="#1A1815" opacity="0.4" />
              </svg>
              <p className="mt-3 text-xs font-medium">Photo will appear here</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <CameraIcon /> Take photo
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <LibraryIcon /> From library
          </Button>
        </div>
        <button
          className="press w-full text-xs text-ink/55 hover:text-ink/80 mb-5"
          onClick={useDemoDog}
        >
          Don't have a photo handy? Use a sample dog →
        </button>

        <div className="mt-2 rounded-2xl bg-cream border border-ink/5 p-4">
          <p className="text-xs font-semibold tracking-tight mb-1">Quick lighting tip</p>
          <p className="text-xs text-ink/65 leading-relaxed">
            Bright but not harsh. Side-on body shot beats top-down. Full silhouette helps the AI keep your dog's, you know, dog shape.
          </p>
        </div>
      </Scroll>

      <div className="px-5 pb-6 pt-3 border-t border-ink/5 bg-cream">
        <Button size="lg" className="w-full" disabled={!preview} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </ScreenContainer>
  )
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4" width="13" height="9" rx="2" stroke="#1A1815" strokeWidth="1.5" />
      <circle cx="8" cy="8.5" r="2.4" stroke="#1A1815" strokeWidth="1.5" />
      <path d="M5.5 4 6 2.5h4l.5 1.5" stroke="#1A1815" strokeWidth="1.5" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.6" stroke="#1A1815" strokeWidth="1.5" />
      <path d="m4 11 3-3 2.5 2.5L11 9l1.5 1.5" stroke="#1A1815" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="6.5" r="1" fill="#1A1815" />
    </svg>
  )
}
