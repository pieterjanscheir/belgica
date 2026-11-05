/**
 * A polite HTTP client for the official sources: it follows each site's robots.txt, sends one
 * request per second per host (or less often, when the site's Crawl-delay asks for it), with an
 * honest user agent, and retries with backoff for network errors and server errors.
 */
import { ALLOW_ALL, DISALLOW_ALL, isAllowed, parseRobots, type Robots } from './robots.ts'

/** The product token robots.txt files can address belgica's crawler by */
export const AGENT = 'belgica'
const USER_AGENT = `${AGENT} (+https://github.com/pieterjanscheir/belgica; open data, sources checked twice a week, the price index daily)`
const DELAY_MS = 1000
const RETRIES = 3

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
            const body = Buffer.from(await res.arrayBuffer())
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
            if (attempt >= RETRIES) throw error
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
