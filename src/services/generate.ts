import type { Style } from '../data/styles'
import { BREEDS } from '../data/breeds'

/**
 * Real img2img via Replicate (FLUX Dev). Falls back to null on any failure;
 * callers should treat null as "no real output, use the CSS-filter stand-in".
 *
 * Auth: REPLICATE_API_TOKEN is injected by the Vite dev server proxy
 * (see vite.config.ts). The browser never sees the token.
 *
 * Opt in by setting VITE_USE_REAL_GENERATION=true in .env.local.
 */

export const REAL_GENERATION_ENABLED =
  (import.meta.env.VITE_USE_REAL_GENERATION as string | undefined) === 'true'

const MODEL = 'black-forest-labs/flux-dev'

type Prediction = {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[] | null
  error?: string | null
  urls?: { get?: string; cancel?: string }
}

function buildPrompt(style: Style, breedId: string, customBreedName?: string) {
  const breed = customBreedName ?? BREEDS.find(b => b.id === breedId)?.name ?? 'dog'
  // Keep the prompt grounded: same dog, same pose, just the coat changes.
  return [
    `Professional pet photography of a ${breed} after grooming with a ${style.name.toLowerCase()} cut.`,
    style.description,
    style.groomerBrief,
    'Same dog, same pose, same face, identity preserved. Sharp focus, natural lighting, full body visible. Clean studio or daylit background.',
  ].join(' ')
}

function negativePrompt() {
  return 'multiple dogs, humans, people, text, watermark, logo, deformed, extra limbs, missing limbs, extra eyes, blurry, low quality, cartoon, illustration, anime, drawing'
}

async function postPrediction(image: string, prompt: string) {
  const res = await fetch(`/api/replicate/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        prompt,
        image,
        prompt_strength: 0.65,
        num_outputs: 1,
        output_format: 'jpg',
        output_quality: 92,
        guidance: 3.5,
        num_inference_steps: 28,
        negative_prompt: negativePrompt(),
        disable_safety_checker: false,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Replicate POST failed: ${res.status} ${text.slice(0, 240)}`)
  }
  return (await res.json()) as Prediction
}

async function getPrediction(id: string) {
  const res = await fetch(`/api/replicate/predictions/${id}`)
  if (!res.ok) {
    throw new Error(`Replicate GET failed: ${res.status}`)
  }
  return (await res.json()) as Prediction
}

async function poll(id: string, signal: AbortSignal): Promise<Prediction> {
  // Replicate's `Prefer: wait=30` (set by the proxy) often returns a finished
  // prediction on the initial POST, so this loop is mostly a safety net.
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error('aborted')
    const p = await getPrediction(id)
    if (p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled') {
      return p
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error('Replicate prediction timed out after 90s')
}

export type GenerateInput = {
  photo: string // data URL (or any URL Replicate can fetch)
  style: Style
  breedId: string
  customBreedName?: string
  signal?: AbortSignal
}

export type GenerateResult =
  | { ok: true; outputUrl: string }
  | { ok: false; reason: string }

export async function generateImage(input: GenerateInput): Promise<GenerateResult> {
  if (!REAL_GENERATION_ENABLED) {
    return { ok: false, reason: 'real generation disabled' }
  }
  if (!input.photo || input.photo === '__demo__') {
    return { ok: false, reason: 'no source photo' }
  }

  const prompt = buildPrompt(input.style, input.breedId, input.customBreedName)
  const signal = input.signal ?? new AbortController().signal

  try {
    let pred = await postPrediction(input.photo, prompt)
    if (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
      pred = await poll(pred.id, signal)
    }
    if (pred.status !== 'succeeded' || !pred.output) {
      return { ok: false, reason: pred.error ?? `status: ${pred.status}` }
    }
    const url = Array.isArray(pred.output) ? pred.output[0] : pred.output
    if (typeof url !== 'string' || !url) {
      return { ok: false, reason: 'no output URL' }
    }
    return { ok: true, outputUrl: url }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}
