/**
 * Standalone CLI: take a dog photo + a reference haircut photo, send both
 * to Gemini 2.5 Flash Image, save the edited image to disk. No app server,
 * no React. Useful for iterating on prompts and reference photos in
 * isolation.
 *
 * Usage:
 *   # by style id (uses the matching public/references/<id>.jpg + the runtime prompt)
 *   npm run edit -- --input=poodle.jpg --style=mohawk
 *
 *   # custom reference photo
 *   npm run edit -- --input=poodle.jpg --reference=path/to/ref.jpg --out=result.jpg
 *
 *   # custom prompt (overrides the per-style instruction)
 *   npm run edit -- --input=poodle.jpg --style=mohawk --prompt="apply the reference haircut, keep my dog's pose and background"
 *
 * Auth: GEMINI_API_KEY in .env.local.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as url from 'node:url'
import dotenv from 'dotenv'
import { STYLES_BY_ID } from '../src/data/styles.ts'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('GEMINI_API_KEY not set. Add it to .env.local.')
  process.exit(1)
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

type Args = {
  input?: string
  reference?: string
  style?: string
  prompt?: string
  out?: string
}
function parseArgs(): Args {
  const a: Args = {}
  for (const arg of process.argv.slice(2)) {
    const [k, ...rest] = arg.replace(/^--/, '').split('=')
    const v = rest.join('=')
    if (k in a || ['input', 'reference', 'style', 'prompt', 'out'].includes(k)) {
      ;(a as Record<string, string>)[k] = v
    }
  }
  return a
}

const here = path.dirname(url.fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')

function mimeOf(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

async function loadAsBase64(filePath: string): Promise<{ mimeType: string; data: string }> {
  const buf = await fs.readFile(filePath)
  return { mimeType: mimeOf(filePath), data: buf.toString('base64') }
}

function buildReferencePrompt(styleName: string): string {
  return [
    'You are given two photographs.',
    "IMAGE 1 is the source: a real photo of the user's dog.",
    'IMAGE 2 is a reference: a different dog wearing the haircut we want.',
    '',
    `Your only task: re-render ONLY the coat and grooming of the dog in IMAGE 1 to match the haircut shown in IMAGE 2 (the "${styleName}" cut).`,
    '',
    'ABSOLUTE RULES — these override every other instruction. The output MUST satisfy ALL of these:',
    '',
    "(1) POSE LOCK. The dog in the output is in the IDENTICAL position to the dog in IMAGE 1: same body angle, same direction the dog is facing, same head tilt, same ear position, same mouth shape, same leg positions, same paw positions. Do not rotate, mirror, re-pose, or shift the dog. If the dog in IMAGE 1 is facing right at a 3/4 angle, the dog in the output is facing right at a 3/4 angle. The dog's silhouette and outline (excluding the new haircut's contour) must match IMAGE 1.",
    '',
    '(2) BACKGROUND LOCK. The background in the output is pixel-identical to IMAGE 1: same grass, sky, ground, water, foliage, objects, lighting, color cast, depth of field, blur, and bokeh. Do not re-render or replace anything in the background.',
    '',
    "(3) FRAMING LOCK. The output has the same camera angle, same field of view, same crop, and same aspect ratio as IMAGE 1. The dog occupies the same region of the frame as in IMAGE 1.",
    '',
    "(4) IDENTITY LOCK. The dog's face, eyes, nose, mouth, expression, ears, markings, body proportions, breed, and coat color (unless the cut explicitly involves dye) match IMAGE 1 exactly. This must look like the SAME dog as IMAGE 1 — not a different dog.",
    '',
    'WHAT TO TAKE FROM IMAGE 2: ONLY the haircut shape — coat length, sculpted volume, the way the fur is cut around the head, ears, body, legs, and tail. NEVER copy IMAGE 2\'s pose, orientation, breed, face, color, expression, framing, or background. IMAGE 2 is a STYLE reference only; nothing else from it transfers.',
    '',
    'The output must read as IMAGE 1 with the coat re-cut, not as a new photograph. Output the edited photograph only.',
  ].join('\n')
}

async function main() {
  const args = parseArgs()

  if (!args.input) {
    console.error('Missing --input=<path-to-dog-photo>')
    process.exit(1)
  }

  const inputPath = path.resolve(projectRoot, args.input)
  let referencePath: string
  let styleName: string

  if (args.reference) {
    referencePath = path.resolve(projectRoot, args.reference)
    styleName = args.style ?? 'custom'
  } else if (args.style) {
    const style = STYLES_BY_ID[args.style]
    if (!style) {
      console.error(`Unknown style id "${args.style}". Try one of: ${Object.keys(STYLES_BY_ID).join(', ')}`)
      process.exit(1)
    }
    if (!style.referenceImage) {
      console.error(`Style "${style.id}" has no referenceImage set. Either run gen-refs first or pass --reference=<path>.`)
      process.exit(1)
    }
    referencePath = path.join(projectRoot, 'public', 'references', style.referenceImage)
    styleName = style.name
  } else {
    console.error('Pass either --style=<id> or --reference=<path>.')
    process.exit(1)
  }

  const outPath = args.out
    ? path.resolve(projectRoot, args.out)
    : path.join(
        path.dirname(inputPath),
        `${path.basename(inputPath, path.extname(inputPath))}-${args.style ?? 'edited'}.jpg`,
      )

  const prompt = args.prompt ?? buildReferencePrompt(styleName)

  console.log(`Input:     ${path.relative(projectRoot, inputPath)}`)
  console.log(`Reference: ${path.relative(projectRoot, referencePath)}`)
  console.log(`Output:    ${path.relative(projectRoot, outPath)}`)
  console.log(`Model:     ${MODEL}`)
  console.log('')

  const [source, reference] = await Promise.all([
    loadAsBase64(inputPath),
    loadAsBase64(referencePath),
  ])

  const t0 = Date.now()
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY!,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'IMAGE 1 (source — preserve everything except the haircut):' },
            { inlineData: source },
            { text: 'IMAGE 2 (reference — copy only the haircut shape):' },
            { inlineData: reference },
            { text: prompt },
          ],
        },
      ],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`HTTP ${res.status}: ${body.slice(0, 500)}`)
    process.exit(1)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string }; text?: string }[] }; finishReason?: string }[]
    promptFeedback?: { blockReason?: string }
    error?: { message?: string }
  }

  if (data.error?.message) {
    console.error(`Gemini: ${data.error.message}`)
    process.exit(1)
  }
  if (data.promptFeedback?.blockReason) {
    console.error(`Blocked: ${data.promptFeedback.blockReason}`)
    process.exit(1)
  }

  const parts = data.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find(p => p.inlineData?.data)
  if (!imagePart?.inlineData) {
    const finish = data.candidates?.[0]?.finishReason
    const text = parts.find(p => p.text)?.text
    console.error(`No image in response${finish ? ` (${finish})` : ''}${text ? `: ${text}` : ''}`)
    process.exit(1)
  }

  const buf = Buffer.from(imagePart.inlineData.data, 'base64')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, buf)
  const ms = Date.now() - t0
  const kb = (buf.byteLength / 1024).toFixed(0)
  console.log(`✓ wrote ${path.relative(projectRoot, outPath)} (${kb} KB, ${ms} ms)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
