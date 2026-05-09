/**
 * Chelsea Dispatch newsletter — runtime using Anthropic Managed Agents.
 *
 * Each invocation creates a new Session against the persistent coordinator
 * agent that was created by `npm run newsletter:setup`.
 *
 * Architecture (true multi-agent — each is a real server-side agent with
 * its own thread, context window, and conversation history):
 *
 *   Coordinator (multiagent: coordinator)
 *     ├── Researcher subagent  → own thread; web_search + web_fetch
 *     ├── Writer subagent      → own thread
 *     └── Editor subagent      → own thread
 *
 * The coordinator delegates real work to subagents — it sees thread events
 * (created, message_sent, message_received, status_idle, …) and the final
 * polished newsletter is written to /mnt/session/outputs/newsletter.md
 * inside the session container, then downloaded via the Files API.
 *
 * Usage:
 *   npm run newsletter:setup       # one-time, creates the agents
 *   npm run newsletter             # default topic
 *   npm run newsletter -- "..."    # custom topic
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))
const client = new Anthropic()

interface AgentConfig {
  environment_id: string
  coordinator_id: string
  researcher_id: string
  writer_id: string
  editor_id: string
  created_at: string
}

function loadConfig(): AgentConfig {
  const configPath = join(__dirname, '..', '.newsletter-agents.json')
  try {
    const raw = readFileSync(configPath, 'utf-8')
    return JSON.parse(raw) as AgentConfig
  } catch {
    console.error('Error: .newsletter-agents.json not found.')
    console.error('Run `npm run newsletter:setup` first to create the agents.')
    process.exit(1)
  }
}

// Some thread/multiagent event fields aren't fully typed in the SDK yet.
// This narrow accessor keeps the logging code honest while we wait.
function fieldOf(event: unknown, key: string): string | undefined {
  const v = (event as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : undefined
}

async function produceNewsletter(topic: string, config: AgentConfig): Promise<string> {
  console.log(`\n🗽 Producing Chelsea Dispatch: "${topic}"\n`)

  // 1. Create the session against the coordinator
  const session = await client.beta.sessions.create({
    agent: config.coordinator_id,
    environment_id: config.environment_id,
    title: `Chelsea Dispatch: ${topic}`,
  })
  console.log(`📍 Session: ${session.id}`)

  // 2. Open the stream FIRST (stream-first ordering — events emitted before
  //    we attach are lost). See shared/managed-agents-events.md.
  const stream = await client.beta.sessions.events.stream(session.id)

  // 3. Send the kickoff message
  await client.beta.sessions.events.send(session.id, {
    events: [
      {
        type: 'user.message',
        content: [
          {
            type: 'text',
            text:
              `Produce a Chelsea Dispatch newsletter edition about: ${topic}.\n\n` +
              `Use your team (researcher → writer → editor) and write the final ` +
              `polished newsletter to /mnt/session/outputs/newsletter.md`,
          },
        ],
      },
    ],
  })

  // 4. Drain the stream until the session is truly done.
  //    Idle-break gate per shared/managed-agents-client-patterns.md Pattern 5:
  //    don't break on bare session.status_idle — it fires transiently.
  for await (const event of stream) {
    switch (event.type) {
      case 'agent.message': {
        const blocks = (event as { content?: Array<{ type: string; text?: string }> }).content ?? []
        for (const block of blocks) {
          if (block.type === 'text' && block.text) {
            const preview = block.text.slice(0, 200)
            const ellipsis = block.text.length > 200 ? '…' : ''
            console.log(`💬 [coordinator] ${preview}${ellipsis}`)
          }
        }
        break
      }
      case 'session.thread_created':
        console.log(`🧵 [thread spawned] ${fieldOf(event, 'agent_name') ?? 'subagent'}`)
        break
      case 'session.thread_status_idle':
        console.log(`💤 [thread idle] ${fieldOf(event, 'agent_name') ?? '?'}`)
        break
      case 'agent.thread_message_sent':
        console.log(`➡️  [coordinator → ${fieldOf(event, 'to_agent_name') ?? 'subagent'}]`)
        break
      case 'agent.thread_message_received':
        console.log(`⬅️  [${fieldOf(event, 'from_agent_name') ?? 'subagent'} → coordinator]`)
        break
      case 'agent.tool_use':
        console.log(`🔧 [tool] ${fieldOf(event, 'name') ?? '?'}`)
        break
      case 'session.error':
        console.error('❌ session.error:', event)
        break
    }

    if (event.type === 'session.status_terminated') {
      console.log('\n⛔ Session terminated')
      break
    }
    if (event.type === 'session.status_idle') {
      const stop = (event as { stop_reason?: { type: string } }).stop_reason
      if (stop?.type === 'requires_action') continue
      console.log(`\n✅ Session idle (${stop?.type ?? 'unknown'})`)
      break
    }
  }

  // 5. Download the newsletter file the coordinator wrote.
  //    Brief indexing lag (~1–3s) between idle and the file appearing in
  //    files.list — retry a few times.
  console.log('\n📥 Looking for output file…')
  let newsletter = ''
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000))
    const files = await client.beta.files.list({
      scope_id: session.id,
      betas: ['managed-agents-2026-04-01'],
    })
    const target = files.data.find((f) => f.filename?.endsWith('newsletter.md'))
    if (target) {
      const resp = await client.beta.files.download(target.id)
      newsletter = await resp.text()
      console.log(`   ✓ ${target.filename} (${target.size_bytes} bytes)`)
      break
    }
  }

  return newsletter
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set in .env.local')
    process.exit(1)
  }

  const config = loadConfig()
  const topic = process.argv[2] ?? "What's new on the High Line this season"

  const newsletter = await produceNewsletter(topic, config)

  if (!newsletter) {
    console.error('\n❌ No newsletter file was produced.')
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
