import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DisallowedError,
    HostError,
    MAX_BYTES,
    NotPublicError,
    TooLargeError,
    delayFor,
    get,
    onHosts,
} from '../../scripts/sources/http.ts'
import { DISALLOW_ALL, isAllowed, parseRobots } from '../../scripts/sources/robots.ts'

const fixture = (name: string) =>
    readFileSync(new URL(`../fixtures/robots/${name}.txt`, import.meta.url), 'utf8')

describe('parseRobots and isAllowed, on the sources’ own robots.txt', () => {
    it('lets belgica read the court and prison pages of the Drupal sites', () => {
        const robots = parseRobots(fixture('drupal'), 'belgica')
        expect(robots.crawlDelay).toBeUndefined()
        for (const url of [
            'https://www.tribunaux-rechtbanken.be/nl/rechtbanken/vredegerecht',
            'https://www.tribunaux-rechtbanken.be/nl/vredegerecht-gent-1/contact',
            'https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen',
            'https://www.tribunaux-rechtbanken.be/core/misc/drupal.js',
        ])
            expect(isAllowed(robots, url), url).toBe(true)
        for (const url of [
            'https://www.tribunaux-rechtbanken.be/search/node?keys=gent',
            'https://www.tribunaux-rechtbanken.be/core/install.php',
            'https://www.tribunaux-rechtbanken.be/index.php/user/login',
            'https://www.tribunaux-rechtbanken.be/nl/media/oembed',
        ])
            expect(isAllowed(robots, url), url).toBe(false)
    })

    it('reads maisonsdejustice.be’s Crawl-delay, and its AI-crawler groups don’t apply', () => {
        const robots = parseRobots(fixture('maisonsdejustice'), 'belgica')
        expect(robots.crawlDelay).toBe(10)
        expect(delayFor(robots)).toBe(10_000)
        const base = 'https://www.maisonsdejustice.be'
        expect(isAllowed(robots, `${base}/menu-de-droite/trouverunemj/`)).toBe(true)
        expect(isAllowed(robots, `${base}/typo3/index.php`)).toBe(false)
        expect(isAllowed(robots, `${base}/typo3temp/assets/x.css`)).toBe(true)
        expect(isAllowed(robots, `${base}/page?tx_solr%5Bq%5D=x`)).toBe(false)
        // The groups for ClaudeBot and others are for them only
        expect(isAllowed(parseRobots(fixture('maisonsdejustice'), 'ClaudeBot'), base + '/')).toBe(
            false,
        )
    })

    it('lets belgica read vlaanderen.be’s houses of justice', () => {
        const robots = parseRobots(fixture('vlaanderen'), 'belgica')
        const base = 'https://www.vlaanderen.be'
        expect(
            isAllowed(robots, `${base}/agentschap-justitie-en-handhaving/justitie/justitiehuizen`),
        ).toBe(true)
        expect(isAllowed(robots, `${base}/servicedesk/x`)).toBe(false)
        expect(delayFor(robots)).toBe(1000)
    })
})

describe('parseRobots', () => {
    it('prefers a group that names belgica, merges its groups and takes the longest delay', () => {
        const robots = parseRobots(
            [
                'Disallow: /before-any-agent',
                'User-agent: *',
                'Disallow: /',
                '',
                'User-agent: other',
                'User-agent: Belgica # case does not matter',
                'Disallow: /private',
                'Crawl-delay: 2',
                'Sitemap: https://example.com/sitemap.xml',
                'User-agent: belgica',
                'Disallow:',
                'Crawl-delay: 5',
                'Crawl-delay: soon',
            ].join('\n'),
            'belgica',
        )
        expect(robots).toEqual({ rules: [{ allow: false, pattern: '/private' }], crawlDelay: 5 })
    })

    it('allows everything without a group for belgica or *', () => {
        const robots = parseRobots('User-agent: other\nDisallow: /', 'belgica')
        expect(robots).toEqual({ rules: [] })
        expect(isAllowed(robots, 'https://example.com/x')).toBe(true)
    })
})

describe('isAllowed', () => {
    const robots = parseRobots(
        'User-agent: *\nDisallow: /a\nAllow: /a\nDisallow: /*.pdf$\nAllow: /b/c\nDisallow: /b',
        'belgica',
    )
    it('lets Allow win a tie and the longest rule win otherwise', () => {
        expect(isAllowed(robots, 'https://example.com/a/x')).toBe(true)
        expect(isAllowed(robots, 'https://example.com/b/c')).toBe(true)
        expect(isAllowed(robots, 'https://example.com/b/d')).toBe(false)
    })
    it('reads * and an ending $', () => {
        expect(isAllowed(robots, 'https://example.com/x/y.pdf')).toBe(false)
        expect(isAllowed(robots, 'https://example.com/x/y.pdf?v=2')).toBe(true)
    })
    it('matches many wildcards without backtracking', () => {
        const many = parseRobots(`User-agent: *\nDisallow: /${'*a'.repeat(30)}*b$`, 'belgica')
        const started = performance.now()
        expect(isAllowed(many, `https://example.com/${'a'.repeat(5000)}`)).toBe(true)
        expect(performance.now() - started).toBeLessThan(100)
        expect(isAllowed(many, `https://example.com/${'a'.repeat(40)}b`)).toBe(false)
    })
    it('matches a rule with non-ASCII characters against the percent-encoded path', () => {
        const accents = parseRobots('User-agent: *\nDisallow: /café', 'belgica')
        expect(isAllowed(accents, 'https://example.com/café/menu')).toBe(false)
        expect(isAllowed(accents, 'https://example.com/cafe')).toBe(true)
    })
    it('always allows the robots.txt itself', () => {
        expect(isAllowed(DISALLOW_ALL, 'https://example.com/robots.txt')).toBe(true)
        expect(isAllowed(DISALLOW_ALL, 'https://example.com/')).toBe(false)
    })
})

describe('get', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    /**
     * A fetch that answers robots.txt with `robots` (a body, or a status), the URLs in
     * `redirects` with a redirect there, and anything else 200
     */
    function stubFetch(robots: string | number, redirects: Record<string, string> = {}) {
        const fetch = vi.fn((url: string) => {
            const location = redirects[url]
            if (location !== undefined)
                return Promise.resolve(new Response('', { status: 302, headers: { location } }))
            if (!url.endsWith('/robots.txt')) return Promise.resolve(new Response('page'))
            return Promise.resolve(
                typeof robots === 'number' ?
                    new Response('', { status: robots })
                :   new Response(robots),
            )
        })
        vi.stubGlobal('fetch', fetch)
        return fetch
    }

    it('refuses a URL the site disallows, without requesting it', async () => {
        const fetch = stubFetch('User-agent: *\nDisallow: /private')
        await expect(get('https://a.example/private/x', ['a.example'])).rejects.toThrow(
            DisallowedError,
        )
        expect((await get('https://a.example/public', ['a.example'])).status).toBe(200)
        // robots.txt is read once per host
        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            'https://a.example/robots.txt',
            'https://a.example/public',
        ])
    })

    it('fetches anything when the site has no robots.txt', async () => {
        stubFetch(404)
        expect((await get('https://b.example/x', ['b.example'])).status).toBe(200)
    })

    it('checks every redirect against robots.txt before following it', async () => {
        const fetch = stubFetch('User-agent: *\nDisallow: /private', {
            'https://c.example/old': '/new',
            'https://c.example/moved': 'https://c.example/private/x',
        })
        const res = await get('https://c.example/old', ['c.example'])
        expect(res).toMatchObject({ url: 'https://c.example/new', status: 200 })
        await expect(get('https://c.example/moved', ['c.example'])).rejects.toThrow(DisallowedError)
        expect(fetch.mock.calls.map(([url]) => url)).not.toContain('https://c.example/private/x')
    })

    it('refuses a redirect to a private address, for a page or for robots.txt, without requesting it', async () => {
        const fetch = stubFetch(404, {
            'https://m.example/robots.txt': 'http://169.254.169.254/robots.txt',
            'https://n.example/page': 'http://127.0.0.1/admin',
        })
        await expect(get('https://m.example/x', ['m.example'])).rejects.toThrow(NotPublicError)
        await expect(get('https://n.example/page', ['n.example'])).rejects.toThrow(NotPublicError)
        const requested = fetch.mock.calls.map(([url]) => url)
        expect(requested).not.toContain('http://169.254.169.254/robots.txt')
        expect(requested).not.toContain('http://127.0.0.1/admin')
    })
})

describe('onHosts', () => {
    it('takes a URL on a listed host, over HTTPS and on the default port', () => {
        const hosts = ['www.example.be', 'example.be']
        expect(onHosts('https://www.example.be/nl/x?y=1', hosts)).toBe(true)
        expect(onHosts('https://EXAMPLE.be:443/', hosts)).toBe(true)
        for (const url of [
            'http://www.example.be/nl/x',
            'https://www.example.be:8443/nl/x',
            'https://www.example.be.other.example/nl/x',
            'https://www.example.be@other.example/nl/x',
            'https://other.example/www.example.be',
            'https://sub.www.example.be/',
            'https://www.example.be./',
            'file:///www.example.be',
            '/nl/x',
        ])
            expect(onHosts(url, hosts), url).toBe(false)
    })
})

describe('get, held to a source’s hosts and to a size', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    /** A fetch that answers each URL with what `answer` gives it, or 200 */
    function stubFetch(answer: (url: string) => Response | string | undefined) {
        const fetch = vi.fn((url: string) => {
            const res = answer(url)
            if (res instanceof Response) return Promise.resolve(res)
            if (res !== undefined)
                return Promise.resolve(
                    new Response('', { status: 302, headers: { location: res } }),
                )
            return Promise.resolve(new Response(url.endsWith('/robots.txt') ? '' : 'page'))
        })
        vi.stubGlobal('fetch', fetch)
        return { requested: () => fetch.mock.calls.map(([url]) => url) }
    }

    /** The outcome of a request, without the client's waits between requests and retries */
    async function settle<T>(promise: Promise<T>): Promise<T> {
        const state = { done: false }
        const settled = promise.finally(() => {
            state.done = true
        })
        settled.catch(() => undefined)
        while (!state.done) await vi.advanceTimersByTimeAsync(1000)
        return settled
    }

    it('refuses a URL on another host, or not over HTTPS, without a request', async () => {
        const { requested } = stubFetch(() => undefined)
        for (const url of [
            'https://d.example.other.example/x',
            'https://d.example@other.example/x',
            'http://d.example/x',
            'https://d.example:8443/x',
        ])
            await expect(settle(get(url, ['d.example'])), url).rejects.toThrow(HostError)
        expect(requested()).toEqual([])
    })

    it('follows a redirect to another host of the source', async () => {
        const { requested } = stubFetch((url) =>
            url === 'https://e.example/fr' ? 'https://e-fr.example/fr' : undefined,
        )
        const res = await settle(get('https://e.example/fr', ['e.example', 'e-fr.example']))
        expect(res).toMatchObject({ url: 'https://e-fr.example/fr', status: 200 })
        expect(requested()).toEqual([
            'https://e.example/robots.txt',
            'https://e.example/fr',
            'https://e-fr.example/robots.txt',
            'https://e-fr.example/fr',
        ])
    })

    it.each([
        ['another host', 'https://other.example/x'],
        ['another host, by a URL without a scheme', '//other.example/x'],
        ['plain HTTP', 'http://f.example/x'],
        ['a look-alike host', 'https://f.example.other.example/x'],
    ])('stops at a redirect to %s, without requesting it', async (_, location) => {
        const { requested } = stubFetch((url) =>
            url === 'https://f.example/old' ? location : undefined,
        )
        await expect(settle(get('https://f.example/old', ['f.example']))).rejects.toThrow(HostError)
        // Neither the page nor that host's robots.txt
        expect(requested().filter((url) => !url.startsWith('https://f.example/'))).toEqual([])
    })

    it('stops at a redirect off the source’s hosts further down the chain', async () => {
        const { requested } = stubFetch(
            (url) =>
                ({
                    'https://g.example/1': '/2',
                    'https://g.example/2': 'https://other.example/3',
                })[url],
        )
        await expect(settle(get('https://g.example/1', ['g.example']))).rejects.toThrow(HostError)
        expect(requested()).toEqual([
            'https://g.example/robots.txt',
            'https://g.example/1',
            'https://g.example/2',
        ])
    })

    it('fails when a robots.txt redirects to a host the source doesn’t list', async () => {
        const { requested } = stubFetch((url) =>
            url === 'https://h.example/robots.txt' ? 'https://other.example/robots.txt' : undefined,
        )
        await expect(settle(get('https://h.example/x', ['h.example']))).rejects.toThrow(HostError)
        expect(requested()).toEqual(['https://h.example/robots.txt'])
    })

    it('refuses a response that says it is over the limit, without retrying', async () => {
        const { requested } = stubFetch((url) =>
            url.endsWith('/big') ?
                new Response('x', { headers: { 'content-length': String(MAX_BYTES + 1) } })
            :   undefined,
        )
        await expect(settle(get('https://i.example/big', ['i.example']))).rejects.toThrow(
            TooLargeError,
        )
        expect(requested()).toEqual(['https://i.example/robots.txt', 'https://i.example/big'])
    })

    it('stops reading a response that grows over the limit', async () => {
        const chunk = new Uint8Array(1024 * 1024)
        let sent = 0
        let cancelled = false
        stubFetch((url) =>
            url.endsWith('/endless') ?
                new Response(
                    new ReadableStream({
                        pull(controller) {
                            sent++
                            controller.enqueue(chunk)
                        },
                        cancel() {
                            cancelled = true
                        },
                    }),
                )
            :   undefined,
        )
        await expect(settle(get('https://j.example/endless', ['j.example']))).rejects.toThrow(
            TooLargeError,
        )
        expect(cancelled).toBe(true)
        expect(sent * chunk.length).toBeLessThan(MAX_BYTES + 3 * chunk.length)
    })

    it('reads a response up to the limit', async () => {
        stubFetch((url) =>
            url.endsWith('/file') ? new Response(new Uint8Array(3 * 1024 * 1024)) : undefined,
        )
        const res = await settle(get('https://k.example/file', ['k.example']))
        expect(res.body.length).toBe(3 * 1024 * 1024)
    })
})
