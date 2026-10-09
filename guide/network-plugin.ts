// Part of the guide, not part of the task.
//
// This Vite plugin stands between each till and the API. It is where the Network control's
// Good, Flaky and Offline settings take effect, one till at a time. It also serves the small
// routes the guide page itself uses, all under /__guide.

import http from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const API = { host: '127.0.0.1', port: 3001 }

type Till = 'a' | 'b'
type Mode = 'good' | 'flaky' | 'offline'
type Fate = 'arrives' | 'lost' | 'answer-lost'

type TrafficEntry = {
  id: number
  at: number
  method: string
  path: string
  // arrived: the till got its answer. lost: the request never reached the API.
  // answer-lost: the API handled it, but the till never heard back.
  outcome: 'arrived' | 'lost' | 'answer-lost' | 'api-down'
  status?: number
}

const TILLS: Till[] = ['a', 'b']
const MODES: Mode[] = ['good', 'flaky', 'offline']

const modes: Record<Till, Mode> = { a: 'good', b: 'good' }
const traffic: Record<Till, TrafficEntry[]> = { a: [], b: [] }
const bags: Record<Till, Fate[]> = { a: [], b: [] }
let nextId = 1

function tillOf(req: IncomingMessage): Till | null {
  const host = (req.headers.host ?? '').toLowerCase()
  if (host.startsWith('a.')) return 'a'
  if (host.startsWith('b.')) return 'b'
  return null
}

// On Flaky, every six things a till sends hold two of each fate, in a shuffled order. That keeps
// the mix honest over a short run instead of leaving it to luck.
function nextFate(till: Till): Fate {
  if (bags[till].length === 0) {
    const bag: Fate[] = ['arrives', 'arrives', 'lost', 'lost', 'answer-lost', 'answer-lost']
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    bags[till] = bag
  }
  return bags[till].pop()!
}

const between = (min: number, max: number) => min + Math.random() * (max - min)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function record(till: Till, req: IncomingMessage, outcome: TrafficEntry['outcome'], status?: number) {
  traffic[till].unshift({
    id: nextId++,
    at: Date.now(),
    method: req.method ?? 'GET',
    path: req.url ?? '',
    outcome,
    status,
  })
  traffic[till].length = Math.min(traffic[till].length, 40)
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

// Passes one request on to the API. With deliverAnswer false the API still handles it, and the
// answer is thrown away. Resolves with the API's status, or null when the API is not running.
function forward(req: IncomingMessage, res: ServerResponse, deliverAnswer: boolean): Promise<number | null> {
  return new Promise((resolve) => {
    const upstream = http.request(
      {
        host: API.host,
        port: API.port,
        method: req.method,
        path: req.url,
        headers: { ...req.headers, host: `${API.host}:${API.port}` },
      },
      (answer) => {
        const status = answer.statusCode ?? 502
        if (deliverAnswer) {
          const { connection: _connection, 'keep-alive': _keepAlive, ...headers } = answer.headers
          res.writeHead(status, headers)
          answer.pipe(res)
        } else {
          answer.resume()
        }
        answer.on('end', () => resolve(status))
      },
    )
    upstream.on('error', () => resolve(null))
    req.pipe(upstream)
  })
}

const API_DOWN = {
  error: 'The API on port 3001 is not answering. Look at the terminal that is running pnpm dev.',
}

async function handleTillRequest(till: Till, req: IncomingMessage, res: ServerResponse) {
  const mode = modes[till]
  const isWrite = req.method !== 'GET' && req.method !== 'HEAD'

  if (mode === 'offline') {
    await wait(80)
    record(till, req, 'lost')
    req.socket.destroy()
    return
  }

  let fate: Fate = 'arrives'
  if (mode === 'flaky') {
    // Reading still works on a bad connection, slowly. Sending is what goes wrong.
    fate = isWrite ? nextFate(till) : 'arrives'
    await wait(between(250, 700))
  }

  if (fate === 'lost') {
    await wait(between(500, 1200))
    record(till, req, 'lost')
    req.socket.destroy()
    return
  }

  const status = await forward(req, res, fate === 'arrives')
  if (status === null) {
    record(till, req, 'api-down')
    if (!res.headersSent) sendJson(res, 502, API_DOWN)
    return
  }
  if (fate === 'answer-lost') {
    await wait(between(500, 1200))
    record(till, req, 'answer-lost', status)
    req.socket.destroy()
    return
  }
  record(till, req, 'arrived', status)
}

// Opened inside a till's frame by "Reset till". It runs on that till's own address, so it clears
// that till's saved data and nothing else, whichever kind of browser storage is in use.
const RESET_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>Resetting the till</title>
<script type="module">
  try { localStorage.clear(); sessionStorage.clear() } catch {}
  try {
    const dbs = (await indexedDB.databases?.()) ?? []
    await Promise.all(dbs.map((db) => db.name && new Promise((done) => {
      const request = indexedDB.deleteDatabase(db.name)
      request.onsuccess = request.onerror = request.onblocked = done
    })))
  } catch {}
  try { for (const key of await caches.keys()) await caches.delete(key) } catch {}
  try { for (const worker of await navigator.serviceWorker.getRegistrations()) await worker.unregister() } catch {}
  location.replace('/')
</script>`

export function guide(): Plugin {
  return {
    name: 'order-pad-guide',
    apply: (_config, env) => env.command === 'serve' && !process.env.VITEST,
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/'
        const path = url.split('?')[0]
        const till = tillOf(req)

        // A browser quietly sends a request again when a connection it was reusing dies. Giving a
        // till a new connection for every request stops that, so one press is one request.
        if (till) res.setHeader('Connection', 'close')

        if (path === '/__guide/state' && req.method === 'GET') {
          sendJson(res, 200, { modes, traffic })
          return
        }

        if (path === '/__guide/network' && req.method === 'POST') {
          const body = await readJson(req)
          const target = TILLS.find((t) => t === body.till)
          const mode = MODES.find((m) => m === body.mode)
          if (!target || !mode) {
            sendJson(res, 400, { error: 'Expected a till (a or b) and a mode (good, flaky or offline).' })
            return
          }
          modes[target] = mode
          bags[target] = []
          sendJson(res, 200, { modes })
          return
        }

        if (path === '/__guide/traffic/clear' && req.method === 'POST') {
          for (const t of TILLS) traffic[t] = []
          sendJson(res, 200, { traffic })
          return
        }

        if (path === '/__guide/reset' && till) {
          res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' })
          res.end(RESET_PAGE)
          return
        }

        if (path.startsWith('/api/')) {
          if (till) {
            await handleTillRequest(till, req, res)
          } else {
            // The guide's own reads (the Kitchen panel) always get through.
            const status = await forward(req, res, true)
            if (status === null && !res.headersSent) sendJson(res, 502, API_DOWN)
          }
          return
        }

        // A till's address shows the till. The plain address shows the guide.
        if (till && (path === '/' || path === '/index.html')) {
          req.url = '/till.html' + url.slice(path.length)
        } else if (!till && path === '/till.html') {
          const port = (req.headers.host ?? '').split(':')[1] ?? '5173'
          res.writeHead(302, { location: `http://a.localhost:${port}/` })
          res.end()
          return
        }

        next()
      })
    },
  }
}
