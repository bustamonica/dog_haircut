import { useSyncExternalStore } from 'react'
import type { Style } from '../data/styles'
import { STYLES_BY_ID } from '../data/styles'

export type Generation = {
  id: string
  styleId: string
  createdAt: number
  /** Source photo as a data URL, or null if the user used the SVG demo dog. */
  sourcePhoto: string | null
  /** Real img2img output URL when available; null means use the CSS-filter stand-in. */
  outputUrl: string | null
  /** Prompt that was sent to (or would have been sent to) the model. Always populated. */
  prompt: string | null
  watermarked: boolean
  savedToBoard: boolean
}

export type DogProfile = {
  breedId: string
  /** Free-text override when the user types a breed not in the curated list. */
  customBreedName?: string
  photo: string | null
  createdAt: number
}

export type Screen =
  | 'splash'
  | 'capture'
  | 'breed'
  | 'generating'
  | 'result'
  | 'paywall'
  | 'library'
  | 'profile'
  | 'groomer-card'
  | 'settings'

type State = {
  screen: Screen
  // a simple navigation stack so the back button works as expected
  stack: Screen[]
  dog: DogProfile | null
  generations: Generation[]
  isPro: boolean
  /** True after the free auto-pick generation has been consumed. */
  freeGenUsed: boolean
  /** Style currently being applied (for generating + result screens). */
  pendingStyleId: string | null
  /** What the result screen is currently showing. */
  activeGenerationId: string | null
}

// localStorage persistence ----------------------------------------------------
//
// The persisted slice excludes nav state (screen/stack) and any in-flight
// generation pointers — those are session-local. On hydrate, we route to the
// "returning user" landing screen (profile) when a dog already exists,
// matching the design doc's returning-user flow.
//
// Photos and generation outputs are data URLs, so the persisted blob can grow
// quickly. localStorage caps at ~5MB per origin; if we exceed that we drop the
// oldest generation and retry. No quota is hit when the user only has a
// handful of generations, which is the common case.
const STORAGE_KEY = 'coif/v1'
const SCHEMA_VERSION = 1

type Persisted = {
  v: number
  dog: DogProfile | null
  generations: Generation[]
  isPro: boolean
  freeGenUsed: boolean
  activeGenerationId: string | null
}

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function loadPersisted(): Persisted | null {
  if (!hasLocalStorage()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persisted
    if (parsed?.v !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function savePersisted(s: State) {
  if (!hasLocalStorage()) return
  // Snapshot only the durable slice. Trim oldest generations on quota.
  const snapshot: Persisted = {
    v: SCHEMA_VERSION,
    dog: s.dog,
    generations: s.generations,
    isPro: s.isPro,
    freeGenUsed: s.freeGenUsed,
    activeGenerationId: s.activeGenerationId,
  }
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      return
    } catch {
      if (snapshot.generations.length === 0) {
        // Even an empty array won't fit — give up silently.
        return
      }
      // Drop the oldest (newest is at index 0).
      snapshot.generations = snapshot.generations.slice(0, -1)
    }
  }
}

function clearPersisted() {
  if (!hasLocalStorage()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function initialState(): State {
  const persisted = loadPersisted()
  const dog = persisted?.dog ?? null
  return {
    screen: dog ? 'profile' : 'splash',
    stack: [],
    dog,
    generations: persisted?.generations ?? [],
    isPro: persisted?.isPro ?? false,
    freeGenUsed: persisted?.freeGenUsed ?? false,
    pendingStyleId: null,
    activeGenerationId: persisted?.activeGenerationId ?? null,
  }
}

let state: State = initialState()

const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | null = null

function emit() {
  for (const l of listeners) l()
  // Debounce localStorage writes — coalesces rapid state updates (a single
  // generation triggers a few setStates in quick succession). 60ms is well
  // below human-perceptible latency and avoids burning main-thread time on
  // duplicate JSON.stringify of the photo data URLs.
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    savePersisted(state)
  }, 60)
}

export function getState() {
  return state
}

export function setState(next: Partial<State>) {
  state = { ...state, ...next }
  emit()
}

export function navigate(screen: Screen) {
  state = { ...state, screen, stack: [...state.stack, state.screen] }
  emit()
}

export function back() {
  if (state.stack.length === 0) return
  const stack = [...state.stack]
  const prev = stack.pop()!
  state = { ...state, screen: prev, stack }
  emit()
}

export function reset() {
  clearPersisted()
  state = {
    screen: 'splash',
    stack: [],
    dog: null,
    generations: [],
    isPro: false,
    freeGenUsed: false,
    pendingStyleId: null,
    activeGenerationId: null,
  }
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => selector(state),
    () => selector(state),
  )
}

export function startGeneration(styleId: string) {
  state = { ...state, screen: 'generating', stack: [...state.stack, state.screen], pendingStyleId: styleId }
  emit()
}

export function finishGeneration(opts: {
  sourcePhoto: string | null
  outputUrl?: string | null
  prompt?: string | null
  markFreeUsed?: boolean
}) {
  if (!state.pendingStyleId) return
  const id = `gen_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const gen: Generation = {
    id,
    styleId: state.pendingStyleId,
    createdAt: Date.now(),
    sourcePhoto: opts.sourcePhoto,
    outputUrl: opts.outputUrl ?? null,
    prompt: opts.prompt ?? null,
    watermarked: !state.isPro,
    savedToBoard: false,
  }
  // After generation, treat "back" from the result as if returning to whatever
  // screen the user was on before they started the gen — never to the empty
  // generating screen. For first-run we collapse the stack to ['profile']
  // so back from the result lands on the dog profile.
  const wasFirstGen = state.generations.length === 0
  const nextStack: Screen[] = wasFirstGen ? ['profile'] : state.stack
  state = {
    ...state,
    generations: [gen, ...state.generations],
    activeGenerationId: id,
    pendingStyleId: null,
    screen: 'result',
    stack: nextStack,
    freeGenUsed: opts.markFreeUsed ? true : state.freeGenUsed,
  }
  emit()
}

export function toggleSave(generationId: string) {
  const generations = state.generations.map(g =>
    g.id === generationId ? { ...g, savedToBoard: !g.savedToBoard } : g,
  )
  state = { ...state, generations }
  emit()
}

export function upgradeToPro() {
  state = { ...state, isPro: true }
  // clear watermarks on existing gens
  state = {
    ...state,
    generations: state.generations.map(g => ({ ...g, watermarked: false })),
  }
  emit()
}

export function getStyleForGeneration(g: Generation): Style | undefined {
  return STYLES_BY_ID[g.styleId]
}
