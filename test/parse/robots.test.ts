import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DisallowedError, delayFor, get } from '../../scripts/sources/http.ts'
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
        await expect(get('https://a.example/private/x')).rejects.toThrow(DisallowedError)
        expect((await get('https://a.example/public')).status).toBe(200)
        // robots.txt is read once per host
        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            'https://a.example/robots.txt',
            'https://a.example/public',
        ])
    })

    it('fetches anything when the site has no robots.txt', async () => {
        stubFetch(404)
        expect((await get('https://b.example/x')).status).toBe(200)
    })

    it('checks every redirect against robots.txt before following it', async () => {
        const fetch = stubFetch('User-agent: *\nDisallow: /private', {
            'https://c.example/old': '/new',
            'https://c.example/moved': 'https://c.example/private/x',
        })
        const res = await get('https://c.example/old')
        expect(res).toMatchObject({ url: 'https://c.example/new', status: 200 })
        await expect(get('https://c.example/moved')).rejects.toThrow(DisallowedError)
        expect(fetch.mock.calls.map(([url]) => url)).not.toContain('https://c.example/private/x')
    })
})
