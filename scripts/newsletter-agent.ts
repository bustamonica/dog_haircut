/**
 * Newsletter generator using multi-agent orchestration.
 *
 * Architecture:
 *   Orchestrator (claude-opus-4-7) coordinates via tool use:
 *     ├── Researcher sub-agent  → talking points and facts
 *     ├── Writer sub-agent      → full newsletter draft in Markdown
 *     └── Editor sub-agent      → polished, publication-ready output
 *
 * Prompt caching is applied to all system prompts (stable across runs).
 * Anthropic's minimum cacheable prefix is 4 096 tokens for Opus 4.7;
 * extend the prompts with a grooming knowledge base in production to
 * consistently exceed that threshold and benefit from cache reads.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/newsletter-agent.ts [topic]
 *   npm run newsletter -- "Doodle summer cuts"
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))
const client = new Anthropic()

// ---------------------------------------------------------------------------
// System prompts  (stable — cache_control marks them for server-side caching)
// ---------------------------------------------------------------------------

const RESEARCHER_SYSTEM = `\
You are the research specialist for "The Snip & Wag Digest", a newsletter for dog owners.
Your job is to surface accurate, interesting content about dog grooming and haircuts.

For the given topic, produce a structured brief covering:
- 3–5 key talking points (what dog owners should know)
- 2–3 interesting facts or statistics
- Seasonal relevance or current trends
- Breed-specific tips where relevant

Keep each point concise. Use a bulleted format. Focus on practical, actionable information.`

const WRITER_SYSTEM = `\
You are the lead writer for "The Snip & Wag Digest", a warm, friendly newsletter for dog owners.
Voice: helpful, conversational, enthusiastic — like a knowledgeable friend, not a textbook.

Given a research brief and topic, write a newsletter edition with:
1. A subject/teaser line (prefix with "Subject: ")
2. A warm greeting ("Hi there, dog lovers!" or similar)
3. Two or three content sections with punchy subheadings and 2–3 paragraphs each
4. A sign-off with a grooming tip of the week

Use clean Markdown. ## for section headings. Target 400–600 words total.`

const EDITOR_SYSTEM = `\
You are the editor of "The Snip & Wag Digest".
Take a newsletter draft and return the publication-ready final version.

Check for:
- Consistent warm, approachable tone
- Clear structure: greeting → content sections → sign-off
- Headline appeal — would a dog owner open this?
- Grammar, spelling, punctuation
- Proper Markdown: # for title, ## for sections, **bold** for key terms

Return ONLY the polished newsletter in Markdown, starting with a # title line.
Do not add commentary or explain your edits.`

const ORCHESTRATOR_SYSTEM = `\
You are the production manager for "The Snip & Wag Digest" newsletter.
You coordinate specialists to produce each edition.

Follow these steps in order every time — never skip or combine steps:
1. Call research_topic with the edition topic.
2. Call write_newsletter with the topic and the research result.
3. Call edit_newsletter with the draft from the writer.
4. Call publish_newsletter with the polished newsletter from the editor.`

// ---------------------------------------------------------------------------
// Sub-agent helpers
// ---------------------------------------------------------------------------

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .flatMap((b) => (b.type === 'text' ? [b.text] : []))
    .join('\n')
}

async function researchTopic(topic: string): Promise<string> {
  console.log(`  [Researcher] Researching "${topic}"…`)
  const res = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: [
      { type: 'text', text: RESEARCHER_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: `Topic: ${topic}` }],
  })
  return extractText(res.content)
}

async function writeNewsletter(topic: string, research: string): Promise<string> {
  console.log(`  [Writer] Drafting newsletter…`)
  const res = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      { type: 'text', text: WRITER_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content: `Topic: ${topic}\n\nResearch brief:\n${research}\n\nWrite the newsletter.`,
      },
    ],
  })
  return extractText(res.content)
}

async function editNewsletter(draft: string): Promise<string> {
  console.log(`  [Editor] Polishing draft…`)
  const res = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      { type: 'text', text: EDITOR_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: `Edit this newsletter draft:\n\n${draft}` }],
  })
  return extractText(res.content)
}

// ---------------------------------------------------------------------------
// Tool definitions for the orchestrator
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'research_topic',
    description:
      'Delegate research to the researcher sub-agent. Returns a structured brief with key points and facts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'The newsletter topic or theme to research' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'write_newsletter',
    description:
      'Delegate writing to the writer sub-agent. Returns a full newsletter draft in Markdown.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'The newsletter topic' },
        research: { type: 'string', description: 'Research brief from the researcher' },
      },
      required: ['topic', 'research'],
    },
  },
  {
    name: 'edit_newsletter',
    description:
      'Delegate editing to the editor sub-agent. Returns the polished, publication-ready newsletter.',
    input_schema: {
      type: 'object' as const,
      properties: {
        draft: { type: 'string', description: 'The newsletter draft to edit' },
      },
      required: ['draft'],
    },
  },
  {
    name: 'publish_newsletter',
    description: 'Mark the newsletter as complete. Call this last with the final edited newsletter.',
    input_schema: {
      type: 'object' as const,
      properties: {
        newsletter: {
          type: 'string',
          description: 'The final edited newsletter in Markdown',
        },
      },
      required: ['newsletter'],
    },
  },
]

// ---------------------------------------------------------------------------
// Orchestrator agentic loop
// ---------------------------------------------------------------------------

async function produce(topic: string): Promise<string> {
  console.log(`\n🐾 Producing newsletter: "${topic}"\n`)

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Produce a newsletter edition about: ${topic}` },
  ]

  let finalNewsletter = ''

  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: [
        { type: 'text', text: ORCHESTRATOR_SYSTEM, cache_control: { type: 'ephemeral' } },
      ],
      tools: TOOLS,
      messages,
    })

    // Preserve the full content (including thinking blocks) for next turn
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') break
    if (response.stop_reason !== 'tool_use') break

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue

      console.log(`\n📋 Orchestrator → ${block.name}`)
      const input = block.input as Record<string, string>
      let result: string

      try {
        switch (block.name) {
          case 'research_topic':
            result = await researchTopic(input.topic)
            break
          case 'write_newsletter':
            result = await writeNewsletter(input.topic, input.research)
            break
          case 'edit_newsletter':
            result = await editNewsletter(input.draft)
            break
          case 'publish_newsletter':
            finalNewsletter = input.newsletter
            result = '✅ Newsletter published.'
            console.log('\n✅ Newsletter complete.')
            break
          default:
            result = `Unknown tool: ${block.name}`
        }
      } catch (err) {
        result = `Error: ${err instanceof Error ? err.message : String(err)}`
      }

      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  return finalNewsletter
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set.')
    console.error('Add it to your .env.local file: ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }

  const topic = process.argv[2] ?? 'Summer grooming tips for long-haired dogs'
  const newsletter = await produce(topic)

  if (!newsletter) {
    console.error('\n❌ Newsletter production did not complete.')
    process.exit(1)
  }

  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const filename = `newsletter-${slug}-${Date.now()}.md`
  const outPath = join(__dirname, '..', filename)
  writeFileSync(outPath, newsletter, 'utf-8')

  console.log(`\n📰 Saved: ${filename}`)
  console.log('\n' + '─'.repeat(60))
  console.log(newsletter)
}

main().catch((err) => {
  if (err instanceof Anthropic.APIError) {
    console.error(`API Error ${err.status}: ${err.message}`)
  } else {
    console.error('Fatal:', err)
  }
  process.exit(1)
})
