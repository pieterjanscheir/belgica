import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

import { isCourtPage, type Source, sources } from '../../scripts/sources/catalog.ts'
import {
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
