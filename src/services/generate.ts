import type { Style } from '../data/styles'

/**
 * Real instruction-based image editing via Replicate (FLUX Kontext Pro).
 * Unlike img2img-with-strength (which is really a color/style nudge),
 * Kontext takes an *edit instruction* and re-renders the targeted region
 * while preserving the rest of the image — including the dog's identity.
 *
 * This matches the design doc's intent: "same dog, same pose, different
 * coat." Identity preservation comes from the model itself, no IP-Adapter
 * Face required for v0.
 *
 * Auth: REPLICATE_API_TOKEN is injected by the Vite dev server proxy
 * (see vite.config.ts). The browser never sees the token.
 *
 * Opt in by setting VITE_USE_REAL_GENERATION=true in .env.local.
 */

export const REAL_GENERATION_ENABLED =
  (import.meta.env.VITE_USE_REAL_GENERATION as string | undefined) === 'true'

const MODEL =
  (import.meta.env.VITE_REPLICATE_MODEL as string | undefined) ||
  'black-forest-labs/flux-kontext-pro'

type Prediction = {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[] | null
  error?: string | null
  urls?: { get?: string; cancel?: string }
}

/**
 * Build an edit instruction targeted at the dog's coat. Kontext is much
 * happier with directives ("change the haircut to X") than with full-scene
 * descriptions. Per-style overrides keep the gag styles (mohawk, dye jobs,
 * lion cut) explicit.
 */
function buildEditInstruction(style: Style): string {
  const tail =
    'Keep the exact same dog (same face, eyes, nose, ears, markings), same pose, same camera angle, same background. Photorealistic pet photography.'

  const overrides: Record<string, string> = {
    mohawk:
      'Give the dog a punk mohawk haircut: short coat on the body, with a tall narrow upright ridge of fur running down the centre of the head and back, like a dog mohawk.',
    'lion-cut':
      'Give the dog a lion cut: shave the body and hindquarters short, leave a full thick mane of fur around the head and shoulders, and a small pom of fur on the tail tip.',
    continental:
      'Give the dog a Continental Poodle clip: shave the hindquarters, face and feet smooth, leave full pompoms (rosettes) on the hips and bracelets of fur on the legs, full pom on the tail, and a sculpted topknot on the head.',
    'summer-shave':
      'Buzz the dog to a very short summer shave all over: short uniform coat close to the skin, body and head, smooth silhouette.',
    'kennel-cut':
      'Give the dog a short kennel cut: short uniform coat about half an inch long all over.',
    'puppy-cut':
      'Give the dog a puppy cut: short even coat about half an inch long, soft rounded face and paws, easy maintenance.',
    'teddy-bear':
      'Give the dog a teddy bear cut: even rounded fluffy coat about 1.5 inches long, very round face, round muzzle, round paws — like a stuffed teddy bear.',
    'powder-puff':
      'Give the dog a powder puff cut: maximum rounded fluff, scissor-finished, perfectly spherical head shape, like a soft cloud.',
    'show-cut':
      'Groom the dog into a clean breed-standard show cut, polished and presentation-ready.',
    'business-casual':
      'Give the dog a tidy short cut: clean face and ears, body trimmed to about 1 inch, neat paws.',
    '70s-rockstar':
      'Give the dog a 1970s rockstar shag haircut: long layered coat with heavy feathering on the ears, center-parted hair on the head, slightly tousled.',
    'wes-anderson':
      'Give the dog a Wes Anderson haircut: perfectly symmetrical, geometric scissor finish with a sharp horizontal hemline, strong center part on the head, painfully tidy. Slight warm beige tint.',
    'hes-just-a-boy':
      'Give the dog a slightly overgrown shaggy haircut with a soft fringe over the eyes — bedhead style, intentionally uneven.',
    'main-character':
      'Give the dog dramatic volume on the head and ears with a clean short body, so the head reads as the focal point.',
    'witness-protection':
      'Give the dog a long heavy fringe of fur falling forward over the eyes and muzzle, completely covering the face.',
    'frosted-tips':
      'Give the dog frosted tips: lighten the very ends of the coat to a pale blonde, especially on top of the head and back, while keeping the base coat color natural.',
    'autumn-drop':
      'Tint the dog\'s coat to warm copper / pumpkin tones, keeping the same haircut shape but with a richer autumnal coat color.',
    'winter-fluff':
      'Make the dog\'s coat extra full, fluffy and well-brushed — peak winter coat, no length removed, soft and voluminous.',
    'designer-paloma':
      'Give the dog asymmetric ear lengths (one ear noticeably longer than the other) and dye one front paw a soft slate-blue color. Keep the rest of the coat natural.',
    'designer-emil':
      'Give the dog a brutalist square-scissored haircut with sharp 90-degree edges at the chest, hips, and head. Severe geometric silhouette.',
    rugrat:
      'Let the dog\'s coat grow to full floor-length, parted down the spine, with a small topknot on the head pulling the fringe out of the eyes — like a tiny walking rug.',
    astroturf:
      'Dye the dog\'s body coat a vivid bright pet-safe green color. Leave the face natural color. Keep the same haircut shape.',
    'sad-prince':
      'Give the dog long mournful ear feathering scissored to a point, with a slightly windswept body coat.',
    bouncer:
      'Give the dog a square shouldered tight body cut with heavy brow fringe left forward over the eyes — intimidating doorman energy.',
    'spring-bloom':
      'Give the dog a clean light short body cut, with the very tips of the ears tinted soft pastel pink.',
    'father-figure':
      'Add dignified silver / grey highlights to the dog\'s muzzle, like a distinguished older dog. Keep the haircut relaxed and slightly longer on the body.',
    'silent-film':
      'Render the dog in high-contrast black and white only, like a vintage silent-film photograph.',
  }

  const directive =
    overrides[style.id] ??
    `Re-groom the dog with a "${style.name}" haircut. ${style.description}`

  return `${directive} ${tail}`
}

async function postPrediction(image: string, prompt: string) {
  const res = await fetch(`/api/replicate/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        prompt,
        input_image: image,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        safety_tolerance: 2,
        prompt_upsampling: false,
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
  // prediction on the initial POST; this loop is mostly a safety net.
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error('aborted')
    const p = await getPrediction(id)
    if (p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled') {
      return p
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error('Replicate prediction timed out after 120s')
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

  const prompt = buildEditInstruction(input.style)
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
