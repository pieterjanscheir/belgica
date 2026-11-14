import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isCourtPage, type Source, sources } from '../../scripts/sources/catalog.ts'
import {
    DisallowedError,
    HostError,
    type Response,
    get as httpGet,
    isPublicUrl,
    onHosts,
} from '../../scripts/sources/http.ts'

const FRENCH = 'https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/'
const houses = sources.find((s) => s.name === 'houses-of-justice')

/** A get that answers every URL with the page `pages` gives it, and records what it fetched */
function site(pages: Record<string, { url?: string; body: string }>, keeps = 14) {
    const fetched: string[] = []
    const get = (url: string): Promise<Response> => {
        fetched.push(url)
        const page = pages[url] ?? { body: '' }
        return Promise.resolve({
            url: page.url ?? url,
            status: 200,
            contentType: 'text/html',
            body: Buffer.from(page.body),
        })
    }
    const kept: string[] = []
    const keep = (prefix: string) => {
        kept.push(prefix)
        return keeps
    }
    return { get, keep, fetched, kept }
}

describe('houses-of-justice source', () => {
    it('fetches every house the French list links to', async () => {
        const { get, keep, fetched, kept } = site({
            [FRENCH]: {
                body: `<a href="maison-justice-namur/">Namur</a><a href="maison-justice-arlon/">Arlon</a>`,
            },
        })
        await houses?.fetch(get, keep)
        expect(fetched).toContain(FRENCH + 'maison-justice-arlon/')
        expect(fetched).toContain(FRENCH + 'maison-justice-namur/')
        expect(kept).toEqual([])
    })

    it.each([
        [
            'a maintenance page',
            { url: 'https://maintenance.cfwb.be/', body: '<h1>Maintenance</h1>' },
        ],
        [
            'the contact form it redirects to',
            {
                url: 'https://www.maisonsdejustice.be/contact',
                body: '<select id="maison"><option>Maison de justice de Namur</option></select>',
            },
        ],
    ])('keeps the last snapshots of the French houses when the list is %s', async (_, page) => {
        const { get, keep, fetched, kept } = site({ [FRENCH]: page })
        await houses?.fetch(get, keep)
        expect(kept).toEqual([FRENCH])
        expect(fetched.filter((url) => url.startsWith(FRENCH + 'maison-justice-'))).toEqual([])
    })

    it('fails when the list is empty and there are no snapshots to keep', async () => {
        const { get, keep } = site(
            { [FRENCH]: { url: 'https://www.maisonsdejustice.be/contact', body: '' } },
            0,
        )
        await expect(houses?.fetch(get, keep)).rejects.toThrow(/none to keep/)
    })
})

describe('ngi source', () => {
    const ngi = sources.find((s) => s.name === 'ngi')
    const refuse = (error: Error) => () => Promise.reject(error)

    it("keeps the last boundaries when robots.txt doesn't allow the download (#195)", async () => {
        const { keep, kept } = site({})
        await ngi?.fetch(refuse(new DisallowedError("robots.txt doesn't allow it")), keep)
        expect(kept).toHaveLength(1)
    })

    it('fails when there are no boundaries to keep', async () => {
        const { keep } = site({}, 0)
        await expect(
            ngi?.fetch(refuse(new DisallowedError("robots.txt doesn't allow it")), keep),
        ).rejects.toThrow(/doesn't allow/)
    })

    it('fails on any other error', async () => {
        const { keep, kept } = site({})
        await expect(ngi?.fetch(refuse(new Error('connection reset')), keep)).rejects.toThrow(
            /connection reset/,
        )
        expect(kept).toEqual([])
    })
})

describe('etaamb source', () => {
    const etaamb = sources.find((s) => s.name === 'etaamb')
    const day = (date: string) =>
        `https://etaamb.openjustice.be/nl/pub/${date.replaceAll('-', '/')}.html`
    const law = (n: number) =>
        `https://etaamb.openjustice.be/nl/wet-van-1-januari-2026_n202600000${n}.html`
    const dayPage = (...urls: string[]) =>
        urls.map((url) => `<a href="${url}" class="doclink day_list">x</a>`).join('')
    // Today is 14 November 2026, so the window starts on 15 September
    const days = ['2026-09-15', '2026-10-05', '2026-10-20', '2026-11-03']
    const months = (bodies: Record<string, string>) => ({
        'https://etaamb.openjustice.be/nl/pub/2026/09.html': {
            body: `<a href="${day(days[0] ?? '')}">15</a>`,
        },
        'https://etaamb.openjustice.be/nl/pub/2026/10.html': {
            body: `<a href="${day(days[1] ?? '')}">5</a><a href="${day(days[2] ?? '')}">20</a>`,
        },
        'https://etaamb.openjustice.be/nl/pub/2026/11.html': {
            body: `<a href="${day(days[3] ?? '')}">3</a>`,
        },
        ...Object.fromEntries(Object.entries(bodies).map(([d, body]) => [day(d), { body }])),
    })

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-11-14T12:00:00Z'))
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('keeps the last snapshot of a day etaamb lists empty, and reads the others', async () => {
        const { get, keep, fetched, kept } = site(
            months({
                '2026-09-15': '',
                '2026-10-05': dayPage(law(1)),
                '2026-10-20': dayPage(law(2)),
                '2026-11-03': dayPage(law(3)),
            }),
        )
        await etaamb?.fetch(get, keep)
        expect(kept).toEqual([day('2026-09-15')])
        expect(fetched).toEqual(expect.arrayContaining([law(1), law(2), law(3)]))
    })

    it('still reads the laws a kept day listed before, so they are not pruned', async () => {
        const { get, keep, fetched } = site(
            months({
                '2026-09-15': '',
                '2026-10-05': dayPage(law(1)),
                '2026-10-20': dayPage(law(2)),
                '2026-11-03': dayPage(law(3)),
            }),
        )
        const before: Record<string, string> = { [day('2026-09-15')]: dayPage(law(4)) }
        await etaamb?.fetch(get, keep, (url) => {
            const body = before[url]
            return body === undefined ? undefined : Buffer.from(body)
        })
        expect(fetched).toEqual(expect.arrayContaining([law(1), law(2), law(3), law(4)]))
    })

    it('fails when most days are empty', async () => {
        const { get, keep } = site(
            months({
                '2026-09-15': '',
                '2026-10-05': '',
                '2026-10-20': '',
                '2026-11-03': dayPage(law(3)),
            }),
        )
        await expect(etaamb?.fetch(get, keep)).rejects.toThrow(/no texts for 3 of 4 days/)
    })
})

describe('isCourtPage', () => {
    it('takes a court’s own page on the portal, in each language', () => {
        for (const url of [
            'https://www.tribunaux-rechtbanken.be/nl/vredegerecht-gent-1',
            'https://www.tribunaux-rechtbanken.be/fr/justice-de-paix-namur-1',
            'https://www.tribunaux-rechtbanken.be/de/friedensgericht-eupen',
        ])
            expect(isCourtPage(url), url).toBe(true)
    })

    it('leaves the portal’s other pages, and pages on any other host', () => {
        for (const url of [
            'https://www.tribunaux-rechtbanken.be/nl/rechtbanken/vredegerecht',
            'https://www.tribunaux-rechtbanken.be/nl/vredegerecht-gent-1/contact',
            'https://www.tribunaux-rechtbanken.be.other.example/nl/vredegerecht-gent-1',
            'https://www.tribunaux-rechtbanken.be@other.example/nl/vredegerecht-gent-1',
            'https://www.tribunaux-rechtbanken.be:8443/nl/vredegerecht-gent-1',
            'http://www.tribunaux-rechtbanken.be/nl/vredegerecht-gent-1',
            'https://other.example/nl/vredegerecht-gent-1',
        ])
            expect(isCourtPage(url), url).toBe(false)
    })
})

describe('every source', () => {
    it('lists the hosts it may request, and starts on one of them', async () => {
        for (const source of sources) {
            expect(source.hosts.length, source.name).toBeGreaterThan(0)
            for (const host of source.hosts) {
                expect(host, source.name).toMatch(/^[a-z0-9.-]+$/)
                // A name on the public web, not an address or a local name
                expect(isPublicUrl(`https://${host}/`) && /[a-z]$/.test(host), host).toBe(true)
            }
            // The first page of the walk; what it does with an empty page doesn't matter here
            const first: string[] = []
            await source
                .fetch(
                    (url) => {
                        first.push(url)
                        return Promise.reject(new Error('stop'))
                    },
                    () => 0,
                )
                .catch(() => undefined)
            expect(onHosts(first[0] ?? '', source.hosts), source.name).toBe(true)
        }
    })
})

/**
 * A walk through the real client, on a site that answers each URL with the page `pages` gives
 * it: what the walk comes to, and every request that was made
 */
async function through(source: Source | undefined, pages: Record<string, string>) {
    if (!source) throw new Error('No such source')
    vi.useFakeTimers()
    const fetch = vi.fn((url: string) =>
        Promise.resolve(
            new globalThis.Response(pages[url] ?? '', { headers: { 'content-type': 'text/html' } }),
        ),
    )
    vi.stubGlobal('fetch', fetch)
    try {
        // The walk, without the client's waits between requests
        const state = { done: false }
        const walk = source
            .fetch(
                (url) => httpGet(url, source.hosts),
                () => 0,
            )
            .then(
                () => undefined,
                (error: unknown) => error,
            )
            .finally(() => {
                state.done = true
            })
        while (!state.done) await vi.advanceTimersByTimeAsync(1000)
        const requested = fetch.mock.calls.map(([url]) => url)
        return {
            error: await walk,
            requested: requested.filter((url) => !url.endsWith('/robots.txt')),
        }
    } finally {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    }
}

describe('prisons source', () => {
    const LIST =
        'https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen'
    const GENT = LIST + '/gevangenissen/adres_gevangenis_gent'
    const prisons = sources.find((s) => s.name === 'prisons')

    it('fetches each prison the list links to, with its translations', async () => {
        const { get, keep, fetched } = site({
            [LIST]: { body: `<a href="${GENT}">Gent</a><a href="/nl/contact">Contact</a>` },
            [GENT]: {
                body: `<a href="/fr/prisons/adresse_prison_gand" hreflang="fr">FR</a><a href="${GENT}" hreflang="nl">NL</a>`,
            },
        })
        await prisons?.fetch(get, keep)
        expect(fetched).toEqual([
            LIST,
            GENT,
            'https://justitie.belgium.be/fr/prisons/adresse_prison_gand',
        ])
    })

    it('goes by a link’s path, not by what it carries along', async () => {
        const { get, keep, fetched } = site({
            [LIST]: {
                body: [
                    GENT,
                    'https://other.example/share?u=' + GENT,
                    LIST + '?q=/gevangenissen/adres_x',
                ]
                    .map((url) => `<a href="${url}">Gent</a>`)
                    .join(''),
            },
        })
        await prisons?.fetch(get, keep)
        expect(fetched).toEqual([LIST, GENT])
    })

    it.each([
        ['on another host', 'https://other.example/nl/gevangenissen/adres_gevangenis_gent'],
        [
            'on a look-alike host',
            'https://justitie.belgium.be.other.example/nl/gevangenissen/adres_gevangenis_gent',
        ],
        ['over plain HTTP', 'http://justitie.belgium.be/nl/gevangenissen/adres_gevangenis_gent'],
    ])('stops at a prison’s page %s, without requesting it', async (_, link) => {
        const { error, requested } = await through(prisons, {
            [LIST]: `<a href="${link}">Gent</a>`,
        })
        expect(error).toBeInstanceOf(HostError)
        expect(requested).toEqual([LIST])
    })

    it('stops at a translation on another host, without requesting it', async () => {
        const { error, requested } = await through(prisons, {
            [LIST]: `<a href="${GENT}">Gent</a>`,
            [GENT]: `<a href="https://other.example/fr/prisons/adresse_prison_gand" hreflang="fr">FR</a>`,
        })
        expect(error).toBeInstanceOf(HostError)
        expect(requested).toEqual([LIST, GENT])
    })
})

describe('a file a source moved to another host', () => {
    // Left out, the walk would succeed and the data stay on the last file it has
    it('stops the Statbel walk', async () => {
        const REFNIS = 'https://statbel.fgov.be/nl/open-data/refnis-code-0'
        const OWN = 'https://statbel.fgov.be/sites/default/files/files/opendata/REFNIS-2025.zip'
        const { error, requested } = await through(
            sources.find((s) => s.name === 'statbel'),
            {
                [REFNIS]: `<a href="${OWN}">2025</a><a href="https://other.example/REFNIS-2026.zip">2026</a>`,
            },
        )
        expect(error).toBeInstanceOf(HostError)
        expect((error as Error).message).toContain('https://other.example')
        expect(requested).toEqual([REFNIS, OWN])
    })

    it('stops the postal codes walk', async () => {
        const GEOGRAPHY =
            'https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie'
        const TABLE = '/files/Conversion%20Postal%20code_Refnis%20code_va01012026.xlsx'
        const { error, requested } = await through(
            sources.find((s) => s.name === 'postal-codes'),
            { [GEOGRAPHY]: `<a href="http://statbel.fgov.be${TABLE}">xlsx</a>` },
        )
        expect(error).toBeInstanceOf(HostError)
        expect(requested).toEqual([GEOGRAPHY])
    })

    it('stops the police zones walk, rather than take an older file', async () => {
        const FEED =
            'https://opendata.fin.belgium.be/download/ATOM/6bcbdf8f-e89f-11ec-be04-9453308970f2-en.xml'
        const zip = (host: string, day: string) =>
            `https://${host}/download/datasets/6bcbdf8f-e89f-11ec-be04-9453308970f2_${day}_shp_3812_01000.zip`
        const { error, requested } = await through(
            sources.find((s) => s.name === 'police-zones'),
            {
                [FEED]: [
                    zip('opendata.fin.belgium.be', '20260618'),
                    zip('other.example', '20270101'),
                ]
                    .map((url) => `<link href="${url}"/>`)
                    .join(''),
            },
        )
        expect(error).toBeInstanceOf(HostError)
        expect(requested).toEqual([FEED])
    })
})

describe('the sources workflow', () => {
    // The dropdown of a manual run: 'all', then every source in the catalog, in its order
    it('offers every source in the catalog to a manual run', () => {
        const workflow = readFileSync('.github/workflows/sources.yml', 'utf8')
        const block = /^ {16}options:\n((?: {20}- .+\n)+)/m.exec(workflow)?.[1] ?? ''
        const options = [...block.matchAll(/- (\S+)/g)].map((m) => m[1])
        expect(options).toEqual(['all', ...sources.map((s) => s.name)])
    })
})
