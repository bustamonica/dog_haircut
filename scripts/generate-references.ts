/**
 * Reference-photo generator. Calls Gemini 2.5 Flash Image once per style
 * (text-to-image, no input photo) and saves the result to public/references/.
 *
 * Usage:
 *   npm run gen-refs                    # all marked styles, skip existing
 *   npm run gen-refs -- --force         # regenerate even if a file exists
 *   npm run gen-refs -- --style=mohawk  # just one
 *   npm run gen-refs -- --breed=doodle  # use a different reference breed
 *
 * Cost: ~$0.039 per image. 7 styles ≈ $0.27.
 *
 * Auth: GEMINI_API_KEY in .env.local. Loaded by dotenv at startup.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as url from 'node:url'
import 'dotenv/config'
import { STYLES } from '../src/data/styles.ts'

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('GEMINI_API_KEY not set. Add it to .env.local.')
  process.exit(1)
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const args = process.argv.slice(2)
const force = args.includes('--force')
const onlyStyle = args.find(a => a.startsWith('--style='))?.split('=')[1]
const breedArg = args.find(a => a.startsWith('--breed='))?.split('=')[1] ?? 'poodle'

const BREEDS: Record<string, string> = {
  poodle: 'a standard poodle with cream / apricot fur',
  doodle: 'a goldendoodle with cream curly fur',
  cocker: 'a cocker spaniel with golden silky fur',
  shihtzu: 'a shih tzu with long flowing white and tan fur',
}
const referenceBreed = BREEDS[breedArg] ?? BREEDS.poodle

const here = path.dirname(url.fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')
const outDir = path.join(projectRoot, 'public', 'references')

function buildPrompt(style: { name: string; description: string; groomerBrief: string }) {
  return [
    `A high-quality professional studio photograph of ${referenceBreed} wearing a "${style.name}" haircut.`,
    `Grooming style: ${style.description}`,
    `Detail: ${style.groomerBrief}`,
    '',
    'Composition: full body visible, three-quarter side view, dog standing calmly facing slightly toward the camera, sharp focus, soft even studio lighting, plain seamless light gray background, no props, no clothing.',
    'Style: photorealistic pet photography, natural color, no text, no watermark, no logos.',
  ].join(' ')
}

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

type Response = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
  error?: { message?: string }
}

async function generateOne(style: typeof STYLES[number]): Promise<'wrote' | 'skipped' | 'failed'> {
  const filename = style.referenceImage
  if (!filename) {
    console.log(`  · ${style.id}: no referenceImage set, skipping`)
    return 'skipped'
  }
  const outPath = path.join(outDir, filename)

  if (!force) {
    try {
      await fs.access(outPath)
      console.log(`  · ${style.id}: already exists, skipping (use --force to redo)`)
      return 'skipped'
    } catch {
      // file doesn't exist, proceed
    }
  }

  const prompt = buildPrompt(style)
  const t0 = Date.now()
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY!,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`  ✗ ${style.id}: HTTP ${res.status} — ${body.slice(0, 200)}`)
    return 'failed'
  }

  const data = (await res.json()) as Response

  if (data.error?.message) {
    console.error(`  ✗ ${style.id}: ${data.error.message}`)
    return 'failed'
  }
  if (data.promptFeedback?.blockReason) {
    console.error(`  ✗ ${style.id}: blocked (${data.promptFeedback.blockReason})`)
    return 'failed'
  }

  const parts = data.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find(
    (p): p is { inlineData: { mimeType: string; data: string } } =>
      'inlineData' in p && !!p.inlineData?.data,
  )
  if (!imagePart) {
    const finish = data.candidates?.[0]?.finishReason
    console.error(`  ✗ ${style.id}: no image in response${finish ? ` (${finish})` : ''}`)
    return 'failed'
  }

  const buf = Buffer.from(imagePart.inlineData.data, 'base64')
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(outPath, buf)
  const ms = Date.now() - t0
  const kb = (buf.byteLength / 1024).toFixed(0)
  console.log(`  ✓ ${style.id}: wrote ${filename} (${kb} KB, ${ms} ms)`)
  return 'wrote'
}

async function main() {
  const targetStyles = STYLES.filter(s => {
    if (!s.referenceImage) return false
    if (onlyStyle && s.id !== onlyStyle) return false
    return true
  })

  if (targetStyles.length === 0) {
    if (onlyStyle) {
      console.error(`No style with id "${onlyStyle}" or it has no referenceImage set.`)
    } else {
      console.error('No styles have referenceImage set. Mark some in src/data/styles.ts.')
    }
    process.exit(1)
  }

  console.log(`Generating references via ${MODEL}`)
  console.log(`Reference breed: ${referenceBreed}`)
  console.log(`Targets: ${targetStyles.map(s => s.id).join(', ')}`)
  console.log('')

  let wrote = 0
  let skipped = 0
  let failed = 0
  for (const style of targetStyles) {
    const status = await generateOne(style)
    if (status === 'wrote') wrote += 1
    else if (status === 'skipped') skipped += 1
    else failed += 1
  }

  console.log('')
  console.log(`Done: ${wrote} written, ${skipped} skipped, ${failed} failed.`)
  if (wrote > 0) {
    const cost = (wrote * 0.039).toFixed(2)
    console.log(`Estimated cost: $${cost}`)
  }
  if (failed > 0) process.exit(1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
