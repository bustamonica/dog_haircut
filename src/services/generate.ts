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
    'Edit the input photograph in place. Strictly preserve the dog\'s face, eyes, nose, ears, markings, body proportions, pose, the camera angle, and the entire background — sky, ground, water, foliage, objects, lighting, depth of field. Do not regenerate the scene. Output the edited photograph only.'

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
    'hes-just-a-boy':
      'Give the dog a slightly overgrown shaggy haircut with a soft fringe over the eyes — bedhead style, intentionally uneven.',
    'main-character':
      'Give the dog dramatic volume on the head and ears with a clean short body, so the head reads as the focal point.',
    'witness-protection':
      'Give the dog a long heavy fringe of fur falling forward over the eyes and muzzle, completely covering the face.',
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
    return { mimeType: 'image/jpeg', base64: dataUrl }
  }
  return { mimeType: match[1], base64: match[2] }
}

/**
 * Reference-image fetch. The reference is a static asset bundled at build
 * time (under public/references/{filename}) and loaded as base64 so it can
 * be sent inline to Gemini. Returns null if the asset is missing —
 * generateImage then falls back to the text-only prompt.
 */
async function loadReference(
  filename: string,
  signal?: AbortSignal,
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(`/references/${filename}`, { signal })
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    const { mimeType, base64 } = splitDataUrl(dataUrl)
    return { mimeType, data: base64 }
  } catch {
    return null
  }
}

function buildReferencePrompt(style: Style): string {
  return [
    'You are given two photographs.',
    'IMAGE 1 is the source: a real photo of the user\'s dog.',
    'IMAGE 2 is a reference: a different dog wearing the haircut we want.',
    '',
    `Edit IMAGE 1 by re-rendering the dog's coat and grooming to match exactly the haircut, coat shape, length, sculpted volume, and styling of the dog in IMAGE 2 (the "${style.name}" cut).`,
    '',
    'Strictly preserve from IMAGE 1, unchanged: the position, pose, and stance of the dog must match IMAGE 1 exactly — same body angle, same direction the dog is facing, same head tilt, same leg positions, same camera angle, same framing and crop. The dog\'s face, eyes, nose, mouth, ears, markings, body proportions, breed, and color (unless the cut explicitly involves dye) must match IMAGE 1 exactly. The entire background (sky, ground, water, foliage, objects), the lighting, and depth of field must match IMAGE 1 exactly.',
    '',
    'Strictly take from IMAGE 2: only the haircut shape — coat length, silhouette, sculpted volume, the way the fur is cut around the head, ears, body, legs, and tail. Ignore the reference dog\'s pose, orientation, breed, color, face, and background entirely.',
    '',
    'Do not regenerate the scene. The output must look like IMAGE 1 with only the haircut altered.',
    '',
    'Output the edited photograph only.',
  ].join(' ')
}

export type GenerateInput = {
  photo: string
  style: Style
  breedId: string
  customBreedName?: string
  signal?: AbortSignal
}

export type GenerateResult =
  | { ok: true; outputUrl: string; usedReference: boolean }
  | { ok: false; reason: string }

export async function generateImage(input: GenerateInput): Promise<GenerateResult> {
  if (!REAL_GENERATION_ENABLED) {
    return { ok: false, reason: 'real generation disabled' }
  }
  if (!input.photo || input.photo === '__demo__') {
    return { ok: false, reason: 'no source photo' }
  }

  const { mimeType, base64 } = splitDataUrl(input.photo)

  // Try to load a reference image; fall through to text-only path if none.
  const refFile = input.style.referenceImage
  const reference = refFile ? await loadReference(refFile, input.signal) : null
  const usedReference = !!reference

  // Build the parts. Order matters: source image first (so the model
  // anchors on it as the canvas to edit), reference second, instruction
  // last (Gemini reads the trailing text as the directive).
  const parts: Part[] = []
  if (reference) {
    parts.push({ text: 'IMAGE 1 (source — preserve everything except the haircut):' })
    parts.push({ inlineData: { mimeType, data: base64 } })
    parts.push({ text: 'IMAGE 2 (reference — copy only the haircut shape):' })
    parts.push({ inlineData: { mimeType: reference.mimeType, data: reference.data } })
    parts.push({ text: buildReferencePrompt(input.style) })
  } else {
    parts.push({ inlineData: { mimeType, data: base64 } })
    parts.push({ text: buildEditInstruction(input.style) })
  }

  try {
    const res = await fetch(`/api/gemini/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: input.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
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

    const respParts = data.candidates?.[0]?.content?.parts ?? []
    const imagePart = respParts.find(
      (p): p is { inlineData: { mimeType: string; data: string } } =>
        'inlineData' in p && !!p.inlineData?.data,
    )
    if (!imagePart) {
      const finish = data.candidates?.[0]?.finishReason
      return { ok: false, reason: finish ? `no image (${finish})` : 'no image in response' }
    }

    const outMime = imagePart.inlineData.mimeType || 'image/png'
    const outputUrl = `data:${outMime};base64,${imagePart.inlineData.data}`
    return { ok: true, outputUrl, usedReference }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}
