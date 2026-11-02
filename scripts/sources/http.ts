/**
 * A polite HTTP client for the official sources: one request per second per host, an honest
 * user agent, and retries with backoff for network errors and server errors.
 */
const USER_AGENT =
    'belgica (+https://github.com/pieterjanscheir/belgica; open data, source check twice a week)'
const DELAY_MS = 1000
const RETRIES = 3

const lastRequest = new Map<string, number>()
/** Each host's queue: sources walked side by side still take turns on a shared host */
const queues = new Map<string, Promise<void>>()
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

function throttle(host: string): Promise<void> {
    const turn = (queues.get(host) ?? Promise.resolve()).then(async () => {
        const wait = (lastRequest.get(host) ?? 0) + DELAY_MS - Date.now()
        if (wait > 0) await sleep(wait)
        lastRequest.set(host, Date.now())
    })
    queues.set(host, turn)
    return turn
}

export async function get(url: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
        await throttle(new URL(url).host)
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
