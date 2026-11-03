/**
 * A polite HTTP client for the official sources: it follows each site's robots.txt, sends one
 * request per second per host (or less often, when the site's Crawl-delay asks for it), with an
 * honest user agent, and retries with backoff for network errors and server errors.
 */
import { ALLOW_ALL, DISALLOW_ALL, isAllowed, parseRobots, type Robots } from './robots.ts'

/** The product token robots.txt files can address belgica's crawler by */
export const AGENT = 'belgica'
const USER_AGENT = `${AGENT} (+https://github.com/pieterjanscheir/belgica; open data, source check twice a week)`
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

async function request(url: string, delay: number): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
        await throttle(new URL(url).host, delay)
        try {
            const res = await fetch(url, {
                headers: { 'user-agent': USER_AGENT },
                redirect: 'follow',
                signal: AbortSignal.timeout(60_000),
            })
            const body = Buffer.from(await res.arrayBuffer())
            if (res.status >= 500 && attempt < RETRIES) throw new Error(`HTTP ${res.status}`)
            return {
                url: res.url,
                status: res.status,
                contentType: res.headers.get('content-type') ?? '',
                body,
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
        robots = request(`${origin}/robots.txt`, DELAY_MS).then((res) => {
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

export async function get(url: string): Promise<Response> {
    const { origin } = new URL(url)
    const robots = await robotsFor(origin)
    if (!isAllowed(robots, url))
        throw new DisallowedError(`${origin}/robots.txt doesn't allow ${url}`)
    return request(url, delayFor(robots))
}
