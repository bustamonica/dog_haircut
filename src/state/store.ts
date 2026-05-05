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

let state: State = {
  screen: 'splash',
  stack: [],
  dog: null,
  generations: [],
  isPro: false,
  freeGenUsed: false,
  pendingStyleId: null,
  activeGenerationId: null,
}

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
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
