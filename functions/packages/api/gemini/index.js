/**
 * DO Function: Gemini API proxy.
 *
 * Browser calls go to /api/gemini/<rest-of-path>. DO App Platform routes
 * everything under /api/ to this function. We strip the /api/gemini prefix,
 * prepend /v1beta, forward to https://generativelanguage.googleapis.com,
 * and inject the GEMINI_API_KEY header server-side so the key never leaves
 * the function runtime.
 *
 * Env var (set in the function component in App Platform):
 *   GEMINI_API_KEY (SECRET)
 */

const GEMINI_HOST = 'https://generativelanguage.googleapis.com'

async function main(args) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return jsonResponse(500, { error: 'GEMINI_API_KEY not configured on the function' })
  }

  // Path the function receives. DO routes /api/gemini/* here and the
  // remainder lands in args.__ow_path (with or without a leading slash
  // depending on routing). Normalize, strip any /api/gemini prefix the
  // gateway didn't already remove, prepend /v1beta.
  let path = String(args.__ow_path || '')
  if (!path.startsWith('/')) path = '/' + path
  path = path.replace(/^\/api\/gemini/, '')
  if (!path.startsWith('/')) path = '/' + path
  const downstreamUrl = `${GEMINI_HOST}/v1beta${path}`

  const method = String(args.__ow_method || 'POST').toUpperCase()

  // DO may deliver the body as either a parsed object, a string, or a
  // base64-encoded string for binary content types. We always re-serialize
  // a JSON body before forwarding.
  let body
  if (method !== 'GET' && method !== 'HEAD') {
    const raw = args.__ow_body
    if (raw == null) {
      body = undefined
    } else if (typeof raw === 'string') {
      body = args.__ow_body_base64 ? Buffer.from(raw, 'base64').toString('utf8') : raw
    } else {
      body = JSON.stringify(raw)
    }
  }

  let res
  try {
    res = await fetch(downstreamUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body,
    })
  } catch (err) {
    return jsonResponse(502, { error: 'Upstream fetch failed', detail: String(err) })
  }

  const text = await res.text()
  return {
    statusCode: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
      // Permissive CORS in case the browser hits the function on a different
      // origin during local testing. In production the static site and the
      // function are same-origin so this is a no-op there.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    },
    body: text,
  }
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

exports.main = main
