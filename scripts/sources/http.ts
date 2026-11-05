/**
 * A polite HTTP client for the official sources: it follows each site's robots.txt, sends one
 * request per second per host (or less often, when the site's Crawl-delay asks for it), with an
 * honest user agent, and retries with backoff for network errors and server errors.
 */
import { isIP } from 'node:net'

import { ALLOW_ALL, DISALLOW_ALL, isAllowed, parseRobots, type Robots } from './robots.ts'

/** The product token robots.txt files can address belgica's crawler by */
export const AGENT = 'belgica'
const USER_AGENT = `${AGENT} (+https://github.com/pieterjanscheir/belgica; open data, source check twice a week)`
const DELAY_MS = 1000
const RETRIES = 3
/**
 * The most a response may hold. The largest download, the NGI's canton GeoPackage, is about
 * 16 MB; this leaves room for it to grow while a runaway response can't fill the runner.
 */
export const MAX_BYTES = 256 * 1024 * 1024

const lastRequest = new Map<string, number>()
/** Each host's queue: sources walked side by side still take turns on a shared host */
const queues = new Map<string, Promise<void>>()
/** Each host's robots.txt, read once per run */
const robotsByHost = new Map<string, Promise<Robots>>()
const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })

export interface Response {
    /** The URL after redirects */
    url: string
    status: number
    contentType: string
    body: Buffer
}

/** The wait between two requests to a host: a second, or the site's Crawl-delay if longer */
export const delayFor = (robots: Robots) => Math.max(DELAY_MS, (robots.crawlDelay ?? 0) * 1000)

function throttle(host: string, delay: number): Promise<void> {
    const turn = (queues.get(host) ?? Promise.resolve()).then(async () => {
        const wait = (lastRequest.get(host) ?? 0) + delay - Date.now()
        if (wait > 0) await sleep(wait)
        lastRequest.set(host, Date.now())
    })
    queues.set(host, turn)
    return turn
}

/** Thrown for a response larger than MAX_BYTES */
export class TooLargeError extends Error {}

/** The body, read until MAX_BYTES and no further */
async function readBody(res: globalThis.Response, url: string): Promise<Buffer> {
    const tooLarge = () => new TooLargeError(`${url}: response larger than ${MAX_BYTES} bytes`)
    if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) {
        await res.body?.cancel()
        throw tooLarge()
    }
    if (!res.body) return Buffer.alloc(0)
    const chunks: Uint8Array[] = []
    let size = 0
    for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength
        if (size > MAX_BYTES) throw tooLarge()
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

/** A response, with where it redirects to when it's a redirect that wasn't followed */
type Fetched = Response & { location?: string }

async function request(
    url: string,
    delay: number,
    redirect: 'follow' | 'manual',
): Promise<Fetched> {
    for (let attempt = 0; ; attempt++) {
        await throttle(new URL(url).host, delay)
        try {
            const res = await fetch(url, {
                headers: { 'user-agent': USER_AGENT },
                redirect,
                signal: AbortSignal.timeout(60_000),
            })
            const body = await readBody(res, url)
            if (res.status >= 500 && attempt < RETRIES) throw new Error(`HTTP ${res.status}`)
            const location = res.headers.get('location')
            return {
                url: res.url,
                status: res.status,
                contentType: res.headers.get('content-type') ?? '',
                body,
                ...(res.status >= 300 && res.status < 400 && location !== null && { location }),
            }
        } catch (error) {
            if (attempt >= RETRIES || error instanceof TooLargeError) throw error
            await sleep(2 ** attempt * 5000)
        }
    }
}

/**
 * A host's robots.txt, as RFC 9309 says to read it: a missing one (4xx) allows everything, and
 * a server error allows nothing, so the source fails and keeps its last snapshots instead of
 * being walked against the site's wishes. A network error that outlasts the retries fails the
 * source the same way, with that error.
 */
function robotsFor(origin: string): Promise<Robots> {
    let robots = robotsByHost.get(origin)
    if (!robots) {
        robots = request(`${origin}/robots.txt`, DELAY_MS, 'follow').then((res) => {
            if (res.status >= 500) return DISALLOW_ALL
            if (res.status >= 400) return ALLOW_ALL
            return parseRobots(res.body.toString('utf8'), AGENT)
        })
        robotsByHost.set(origin, robots)
    }
    return robots
}

/** Thrown for a URL that isn't on the public web: another scheme, or a local or private host */
export class NotPublicError extends Error {}

/**
 * Whether a URL may be fetched: http or https, to a host name or a public IP address. The sources
 * are public websites, so a link or a redirect to localhost, a private network or the cloud
 * metadata address (169.254.169.254) is refused instead of being requested from the runner.
 * It looks at the URL only, not at what a name resolves to.
 */
export function isPublicUrl(url: string): boolean {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false
    const version = isIP(host)
    if (version === 4) {
        const [a = 0, b = 0] = host.split('.').map(Number)
        return !(
            a === 0 ||
            a === 10 ||
            a === 127 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            a >= 224
        )
    }
    if (version === 6) {
        // Loopback, unspecified, unique local, link local, and IPv4 written as IPv6
        return !/^(::1?|f[cd][0-9a-f]*:.*|fe[89ab][0-9a-f]*:.*|::ffff:.*)$/.test(host)
    }
    return true
}

/** Thrown for a URL the site's robots.txt doesn't let belgica fetch */
export class DisallowedError extends Error {}

/** How many redirects a page may go through, as browsers allow */
const MAX_REDIRECTS = 20

/**
 * Fetches a URL, following its redirects one at a time so that every hop is checked against its
 * own site's robots.txt (and waits that site's delay) before it's requested.
 */
export async function get(url: string): Promise<Response> {
    let current = url
    for (let hops = 0; ; hops++) {
        if (!isPublicUrl(current)) throw new NotPublicError(`Not a public web address: ${current}`)
        const { origin } = new URL(current)
        const robots = await robotsFor(origin)
        if (!isAllowed(robots, current))
            throw new DisallowedError(`${origin}/robots.txt doesn't allow ${current}`)
        const { location, ...res } = await request(current, delayFor(robots), 'manual')
        if (location === undefined) return { ...res, url: current }
        if (hops >= MAX_REDIRECTS) throw new Error(`Too many redirects from ${url}`)
        current = new URL(location, current).href
    }
}
