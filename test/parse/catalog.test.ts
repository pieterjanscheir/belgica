import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { sources } from '../../scripts/sources/catalog.ts'
import type { Response } from '../../scripts/sources/http.ts'

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

describe('the sources workflow', () => {
    // The dropdown of a manual run: 'all', then every source in the catalog, in its order
    it('offers every source in the catalog to a manual run', () => {
        const workflow = readFileSync('.github/workflows/sources.yml', 'utf8')
        const block = /^ {16}options:\n((?: {20}- .+\n)+)/m.exec(workflow)?.[1] ?? ''
        const options = [...block.matchAll(/- (\S+)/g)].map((m) => m[1])
        expect(options).toEqual(['all', ...sources.map((s) => s.name)])
    })
})
