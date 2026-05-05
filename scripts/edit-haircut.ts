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
    `Edit IMAGE 1 by re-rendering the dog's coat and grooming to match exactly the haircut, coat shape, length, sculpted volume, and styling of the dog in IMAGE 2 (the "${styleName}" cut).`,
    '',
    "Strictly preserve from IMAGE 1, unchanged: the position, pose, and stance of the dog must match IMAGE 1 exactly — same body angle, same direction the dog is facing, same head tilt, same leg positions, same camera angle, same framing and crop. The dog's face, eyes, nose, mouth, ears, markings, body proportions, breed, and color (unless the cut explicitly involves dye) must match IMAGE 1 exactly. The entire background (sky, ground, water, foliage, objects), the lighting, and depth of field must match IMAGE 1 exactly.",
    '',
    "Strictly take from IMAGE 2: only the haircut shape — coat length, silhouette, sculpted volume, the way the fur is cut around the head, ears, body, legs, and tail. Ignore the reference dog's pose, orientation, breed, color, face, and background entirely.",
    '',
    'Do not regenerate the scene. The output must look like IMAGE 1 with only the haircut altered.',
    '',
    'Output the edited photograph only.',
  ].join(' ')
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
