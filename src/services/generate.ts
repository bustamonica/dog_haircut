import type { Style } from '../data/styles'

/**
 * Real instruction-based image editing via Google's Gemini 2.5 Flash Image
 * (a.k.a. "nano-banana"). Takes the user's photo + a coat-edit instruction
 * and returns a re-rendered image with the requested haircut, preserving
 * dog identity, pose, and background.
 *
 * Auth: GEMINI_API_KEY is injected by the Vite dev server proxy
 * (see vite.config.ts). The browser never sees the key.
 *
 * Opt in by setting VITE_USE_REAL_GENERATION=true in .env.local.
 */

export const REAL_GENERATION_ENABLED =
  (import.meta.env.VITE_USE_REAL_GENERATION as string | undefined) === 'true'

const MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ||
  'gemini-2.5-flash-image'

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

type Candidate = {
  content?: { parts?: Part[] }
  finishReason?: string
}

type GeminiResponse = {
  candidates?: Candidate[]
  promptFeedback?: { blockReason?: string }
  error?: { message?: string }
}

export function buildEditInstruction(style: Style): string {
  const tail =
    'Keep the exact same dog (same face, eyes, nose, ears, markings), same pose, same camera angle, same background. Photorealistic pet photography, sharp focus, natural lighting.'

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
      "Tint the dog's coat to warm copper / pumpkin tones, keeping the same haircut shape but with a richer autumnal coat color.",
    'winter-fluff':
      "Make the dog's coat extra full, fluffy and well-brushed — peak winter coat, no length removed, soft and voluminous.",
    'designer-paloma':
      'Give the dog asymmetric ear lengths (one ear noticeably longer than the other) and dye one front paw a soft slate-blue color. Keep the rest of the coat natural.',
    'designer-emil':
      'Give the dog a brutalist square-scissored haircut with sharp 90-degree edges at the chest, hips, and head. Severe geometric silhouette.',
    rugrat:
      "Let the dog's coat grow to full floor-length, parted down the spine, with a small topknot on the head pulling the fringe out of the eyes — like a tiny walking rug.",
    astroturf:
      "Dye the dog's body coat a vivid bright pet-safe green color. Leave the face natural color. Keep the same haircut shape.",
    'sad-prince':
      'Give the dog long mournful ear feathering scissored to a point, with a slightly windswept body coat.',
    bouncer:
      'Give the dog a square shouldered tight body cut with heavy brow fringe left forward over the eyes — intimidating doorman energy.',
    'spring-bloom':
      'Give the dog a clean light short body cut, with the very tips of the ears tinted soft pastel pink.',
    'father-figure':
      "Add dignified silver / grey highlights to the dog's muzzle, like a distinguished older dog. Keep the haircut relaxed and slightly longer on the body.",
    'silent-film':
      'Render the dog in high-contrast black and white only, like a vintage silent-film photograph.',
  }

  const directive =
    overrides[style.id] ??
    `Re-groom the dog with a "${style.name}" haircut. ${style.description}`

  return `${directive} ${tail}`
}

function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/)
  if (!match) {
    // Assume jpeg if no header
    return { mimeType: 'image/jpeg', base64: dataUrl }
  }
  return { mimeType: match[1], base64: match[2] }
}

export type GenerateInput = {
  photo: string
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

  const { mimeType, base64 } = splitDataUrl(input.photo)
  const prompt = buildEditInstruction(input.style)

  try {
    const res = await fetch(`/api/gemini/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: input.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          // Image-capable response. The model emits image bytes inline.
          responseModalities: ['IMAGE'],
        },
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, reason: `Gemini ${res.status}: ${text.slice(0, 240)}` }
    }

    const data = (await res.json()) as GeminiResponse

    if (data.error?.message) {
      return { ok: false, reason: data.error.message }
    }
    if (data.promptFeedback?.blockReason) {
      return { ok: false, reason: `blocked: ${data.promptFeedback.blockReason}` }
    }

    const parts = data.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find(
      (p): p is { inlineData: { mimeType: string; data: string } } =>
        'inlineData' in p && !!p.inlineData?.data,
    )
    if (!imagePart) {
      const finish = data.candidates?.[0]?.finishReason
      return { ok: false, reason: finish ? `no image (${finish})` : 'no image in response' }
    }

    const outMime = imagePart.inlineData.mimeType || 'image/png'
    const outputUrl = `data:${outMime};base64,${imagePart.inlineData.data}`
    return { ok: true, outputUrl }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}
