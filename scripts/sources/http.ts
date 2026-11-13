/**
 * A polite HTTP client for the official sources: it follows each site's robots.txt, sends one
 * request per second per host (or less often, when the site's Crawl-delay asks for it), with an
 * honest user agent, and retries with backoff for network errors and server errors.
 *
 * It only talks to the hosts a source lists (catalog.ts), over HTTPS, and never to a local or
 * private address: every request is checked, each hop of a redirect and each robots.txt
 * included. And it reads no more than MAX_BYTES of a response.
 */
import { isIP } from 'node:net'

import { ALLOW_ALL, DISALLOW_ALL, isAllowed, parseRobots, type Robots } from './robots.ts'

/** The product token robots.txt files can address belgica's crawler by */
export const AGENT = 'belgica'
const USER_AGENT = `${AGENT} (+https://github.com/pieterjanscheir/belgica; open data, sources checked twice a week, the price index daily)`
const DELAY_MS = 1000
const RETRIES = 3

/**
 * The most a response body may weigh. The largest file the sources fetch is the NGI's GeoPackage
 * of the judicial cantons (16 MB zipped), then the police zones' shapefile (8 MB); Statbel's
 * files and every page are well under 1 MB. Four times the largest leaves it room to grow, and
 * stays under the 100 MB GitHub accepts for a file on the `sources` branch.
 */
export const MAX_BYTES = 64 * 1024 * 1024

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

/** Thrown for a URL that isn't on one of its source's hosts, over HTTPS */
export class HostError extends Error {}

/** Thrown for a response that weighs more than MAX_BYTES */
export class TooLargeError extends Error {}

/** Whether a URL is on one of these hosts, over HTTPS and on its default port */
export function onHosts(url: string, hosts: readonly string[]): boolean {
    if (!URL.canParse(url)) return false
    const { protocol, host } = new URL(url)
    return protocol === 'https:' && hosts.includes(host)
}

function assertOnHosts(url: string, hosts: readonly string[]): void {
    if (onHosts(url, hosts)) return
    const { protocol, host } = new URL(url)
    throw new HostError(`${protocol}//${host} isn't one of this source's hosts`)
}

/** A response's body, read as it arrives so that one over MAX_BYTES is dropped, not held */
async function read(res: Awaited<ReturnType<typeof fetch>>, url: string): Promise<Buffer> {
    const reader = res.body?.getReader()
    if (!reader) return Buffer.alloc(0)
    const chunks: Uint8Array[] = []
    // What the server says it will send is refused unread. The count is for a server that
    // doesn't say, and for a body that grows when it's decompressed.
    let size = Number(res.headers.get('content-length')) > MAX_BYTES ? Infinity : 0
    while (size <= MAX_BYTES) {
        const { done, value } = (await reader.read()) as { done: boolean; value?: Uint8Array }
        if (done || !value) return Buffer.concat(chunks)
        chunks.push(value)
        size += value.byteLength
    }
    await reader.cancel()
    throw new TooLargeError(
        `A response from ${new URL(url).host} weighs more than ${MAX_BYTES} bytes`,
    )
}

/** A response, with where it redirects to when it's a redirect */
type Fetched = Response & { location?: string }

/** One request, without following a redirect: the caller checks where it leads first */
async function request(url: string, delay: number): Promise<Fetched> {
    for (let attempt = 0; ; attempt++) {
        await throttle(new URL(url).host, delay)
        try {
            const res = await fetch(url, {
                headers: { 'user-agent': USER_AGENT },
                redirect: 'manual',
                signal: AbortSignal.timeout(60_000),
            })
            const body = await read(res, url)
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
            // Asking again wouldn't make it smaller
            if (error instanceof TooLargeError || attempt >= RETRIES) throw error
            await sleep(2 ** attempt * 5000)
        }
    }
}

/** How many redirects a page may go through, as browsers allow */
const MAX_REDIRECTS = 20

/**
 * Requests a URL and follows its redirects one at a time, so that every hop is held to the
 * public web, to the source's hosts and to what `before` asks of it, before it's requested.
 */
async function follow(
    url: string,
    hosts: readonly string[],
    before: (hop: string) => Promise<number>,
): Promise<Response> {
    let current = url
    for (let hops = 0; ; hops++) {
        if (!isPublicUrl(current)) throw new NotPublicError(`Not a public web address: ${current}`)
        assertOnHosts(current, hosts)
        const { location, ...res } = await request(current, await before(current))
        if (location === undefined) return { ...res, url: current }
        if (hops >= MAX_REDIRECTS) throw new Error(`Too many redirects from ${url}`)
        current = new URL(location, current).href
    }
}

/**
 * A host's robots.txt, as RFC 9309 says to read it: a missing one (4xx) allows everything, and
 * a server error allows nothing, so the source fails and keeps its last snapshots instead of
 * being walked against the site's wishes. A network error that outlasts the retries fails the
 * source the same way, with that error, and so does a robots.txt that redirects to a host the
 * source doesn't list.
 */
function robotsFor(origin: string, hosts: readonly string[]): Promise<Robots> {
    let robots = robotsByHost.get(origin)
    if (!robots) {
        robots = follow(`${origin}/robots.txt`, hosts, () => Promise.resolve(DELAY_MS)).then(
            (res) => {
                if (res.status >= 500) return DISALLOW_ALL
                if (res.status >= 400) return ALLOW_ALL
                return parseRobots(res.body.toString('utf8'), AGENT)
            },
        )
        // A failure isn't kept: the source fails now, and a later request asks again
        robots.catch(() => robotsByHost.delete(origin))
        robotsByHost.set(origin, robots)
    }
    return robots
}

/** Thrown for a URL the site's robots.txt doesn't let belgica fetch */
export class DisallowedError extends Error {}

/**
 * Fetches a URL for a source that may request `hosts`. Every hop of a redirect must be on one
 * of those hosts, is checked against its own site's robots.txt, and waits that site's delay,
 * before it's requested.
 */
export function get(url: string, hosts: readonly string[]): Promise<Response> {
    return follow(url, hosts, async (hop) => {
        const { origin } = new URL(hop)
        const robots = await robotsFor(origin, hosts)
        if (!isAllowed(robots, hop))
            throw new DisallowedError(`${origin}/robots.txt doesn't allow ${hop}`)
        return delayFor(robots)
    })
}
