/**
 * One-time setup for the Chelsea Dispatch agent system.
 *
 * Creates 4 persistent Managed Agents (researcher, writer, editor, coordinator)
 * + a cloud environment, then writes their IDs to .newsletter-agents.json
 * for the runtime script to consume.
 *
 * Run this ONCE. Re-run only if you change agent configuration — note that
 * re-running creates new agents; old ones become orphaned but are not
 * automatically archived.
 *
 * Usage:
 *   npm run newsletter:setup
 */

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))
const client = new Anthropic()

// ---------------------------------------------------------------------------
// System prompts — one per agent. Each is its own context window.
// ---------------------------------------------------------------------------

const RESEARCHER_SYSTEM = `\
You are the research specialist for "Chelsea Dispatch", a neighborhood newsletter
about Chelsea, Manhattan, NYC. Chelsea spans roughly 14th to 30th Street on the
west side. Notable features: the High Line, Chelsea Market, the gallery district,
Hudson Yards, Hell's Kitchen border, the Meatpacking District, vibrant LGBTQ+
community.

When given a topic by the coordinator:
1. Use web_search and web_fetch to gather CURRENT information about the topic
   in Chelsea — not generic NYC info
2. Find specific venues, streets, dates, and details
3. Look for: recent news, upcoming events, new openings, neighborhood angles

Return a structured research brief with:
- 3–5 key talking points
- Specific venues, addresses, or landmarks
- Current events or seasonal angles
- Sources where possible

Keep it concise but specific. Prioritize accuracy over breadth.`

const WRITER_SYSTEM = `\
You are the lead writer for "Chelsea Dispatch", a neighborhood newsletter for
residents of Chelsea, Manhattan, NYC.

Voice: insider, curious, warm — written by a neighbor who knows the area well,
not a tourist guide. Specific. References real places.

When given a topic and research brief by the coordinator, write a newsletter
edition with:
1. Subject line (prefix "Subject:")
2. Punchy 1–2 sentence opening (no generic greetings)
3. Two or three content sections with specific subheadings and 2–3 paragraphs each
4. A short "This week in Chelsea" sign-off with one local recommendation

Use clean Markdown. ## for section headings. Target 400–600 words.
Be specific — name real streets, venues, landmarks.`

const EDITOR_SYSTEM = `\
You are the editor of "Chelsea Dispatch", a neighborhood newsletter about
Chelsea, Manhattan, NYC.

When given a draft by the coordinator, polish it into the publication-ready
final version.

Check for:
- Insider neighborhood voice (not tourist-y, not corporate)
- Specific local details — replace any vague "the neighborhood" references
  with actual street names, venue names, or Chelsea landmarks
- Clear structure: opening → content sections → sign-off
- Subject line appeal — would a Chelsea resident open this email?
- Grammar, spelling, punctuation
- Proper Markdown: # for title, ## for sections, **bold** for emphasis

Return ONLY the polished newsletter in Markdown, starting with a # title line.
Do not add commentary or explain your edits.`

const COORDINATOR_SYSTEM = `\
You are the production manager for "Chelsea Dispatch", a neighborhood newsletter
about Chelsea, Manhattan, NYC.

You coordinate three specialists to produce each edition:
- Researcher: gathers current info, talking points, and facts about Chelsea
- Writer: drafts newsletter content from research briefs
- Editor: polishes drafts into publication-ready Markdown

For each edition, follow this workflow:
1. Delegate to the Researcher: provide the topic, ask for a research brief
2. Delegate to the Writer: provide the topic AND the research brief, ask for a draft
3. Delegate to the Editor: provide the draft, ask for the polished final version
4. Write the editor's final output to /mnt/session/outputs/newsletter.md
   using the write tool

Always complete all four steps in order. Be concise when delegating — the
subagents have full context about their roles from their own system prompts.`

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set in .env.local')
    process.exit(1)
  }

  const configPath = join(__dirname, '..', '.newsletter-agents.json')
  if (existsSync(configPath)) {
    console.warn('⚠️  .newsletter-agents.json already exists.')
    console.warn('   Re-running setup will create a NEW set of agents.')
    console.warn('   The old ones will become orphaned (not auto-archived).')
    console.warn('   Delete the file first if you want to keep using existing agents.\n')
  }

  console.log('Setting up Chelsea Dispatch agent system...\n')

  // 1. Cloud environment (unrestricted networking — researcher needs web access)
  console.log('Creating environment...')
  const env = await client.beta.environments.create({
    name: `chelsea-dispatch-${Date.now()}`,
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  })
  console.log(`  ✓ environment: ${env.id}`)

  // 2. Researcher subagent
  console.log('Creating researcher agent...')
  const researcher = await client.beta.agents.create({
    name: 'Chelsea Dispatch Researcher',
    model: 'claude-opus-4-7',
    system: RESEARCHER_SYSTEM,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: true } }],
  })
  console.log(`  ✓ researcher: ${researcher.id}`)

  // 3. Writer subagent
  console.log('Creating writer agent...')
  const writer = await client.beta.agents.create({
    name: 'Chelsea Dispatch Writer',
    model: 'claude-opus-4-7',
    system: WRITER_SYSTEM,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: true } }],
  })
  console.log(`  ✓ writer: ${writer.id}`)

  // 4. Editor subagent
  console.log('Creating editor agent...')
  const editor = await client.beta.agents.create({
    name: 'Chelsea Dispatch Editor',
    model: 'claude-opus-4-7',
    system: EDITOR_SYSTEM,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: true } }],
  })
  console.log(`  ✓ editor: ${editor.id}`)

  // 5. Coordinator with multiagent roster — this is what makes it true
  // multi-agent orchestration. Each subagent ID is referenced by string
  // shorthand (latest version), so updating a subagent's prompt later
  // will be picked up automatically by new sessions.
  console.log('Creating coordinator agent (with multiagent roster)...')
  const coordinator = await client.beta.agents.create({
    name: 'Chelsea Dispatch Coordinator',
    model: 'claude-opus-4-7',
    system: COORDINATOR_SYSTEM,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: true } }],
    multiagent: {
      type: 'coordinator',
      agents: [researcher.id, writer.id, editor.id],
    },
  })
  console.log(`  ✓ coordinator: ${coordinator.id}`)

  const config = {
    environment_id: env.id,
    coordinator_id: coordinator.id,
    researcher_id: researcher.id,
    writer_id: writer.id,
    editor_id: editor.id,
    created_at: new Date().toISOString(),
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

  console.log(`\n✅ Setup complete. IDs saved to .newsletter-agents.json`)
  console.log(`   Run \`npm run newsletter\` to produce a newsletter.`)
}

main().catch((err) => {
  if (err instanceof Anthropic.APIError) {
    console.error(`API Error ${err.status}: ${err.message}`)
  } else {
    console.error('Fatal:', err)
  }
  process.exit(1)
})
