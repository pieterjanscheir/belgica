import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sources } from '../../scripts/sources/catalog.ts'
import { DisallowedError, type Response } from '../../scripts/sources/http.ts'

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

describe('the sources workflow', () => {
    // The dropdown of a manual run: 'all', then every source in the catalog, in its order
    it('offers every source in the catalog to a manual run', () => {
        const workflow = readFileSync('.github/workflows/sources.yml', 'utf8')
        const block = /^ {16}options:\n((?: {20}- .+\n)+)/m.exec(workflow)?.[1] ?? ''
        const options = [...block.matchAll(/- (\S+)/g)].map((m) => m[1])
        expect(options).toEqual(['all', ...sources.map((s) => s.name)])
    })
})
