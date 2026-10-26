import { describe, expect, it } from 'vitest'

import { sources } from '../../scripts/sources/catalog.ts'
import type { Response } from '../../scripts/sources/http.ts'

const FRENCH = 'https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/'
const houses = sources.find((s) => s.name === 'houses-of-justice')

/** A get that answers every URL with the page `pages` gives it, and records what it fetched */
function site(pages: Record<string, { url?: string; body: string }>) {
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
    return { get, fetched }
}

describe('houses-of-justice source', () => {
    it('fetches every house the French list links to', async () => {
        const { get, fetched } = site({
            [FRENCH]: {
                body: `<a href="maison-justice-namur/">Namur</a><a href="maison-justice-arlon/">Arlon</a>`,
            },
        })
        await houses?.fetch(get)
        expect(fetched).toContain(FRENCH + 'maison-justice-arlon/')
        expect(fetched).toContain(FRENCH + 'maison-justice-namur/')
    })

    it('fails when the list is a maintenance page, so the snapshots stay as they were', async () => {
        const { get } = site({
            [FRENCH]: { url: 'https://maintenance.cfwb.be/', body: '<h1>Maintenance</h1>' },
        })
        await expect(houses?.fetch(get)).rejects.toThrow(/No houses of justice listed/)
    })
})
