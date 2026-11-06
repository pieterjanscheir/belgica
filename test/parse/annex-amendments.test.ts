// The laws that change the annex to the Judicial Code, on test/fixtures/sources/etaamb: a trimmed
// copy of the real law of 15 May 2024 (chapter 8 changes the annex), and a made-up law of
// October 2026 that cites the Judicial Code but not its annex
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

import {
    annexSignals,
    readAmendment,
    readAnnexAmendments,
    readAnnexVersion,
    type Amendment,
} from '../../scripts/parse/annex-amendments.ts'
import { dayList, etaambDay, isEtaambLaw, months, sources } from '../../scripts/sources/catalog.ts'
import type { Response } from '../../scripts/sources/http.ts'

const root = 'test/fixtures/sources'
const LAW = 'https://etaamb.openjustice.be/nl/wet-van-15-mei-2024_n2024004698.html'

const law: Amendment = {
    numac: '2024004698',
    title: 'Wet houdende bepalingen inzake digitalisering van justitie en diverse bepalingen II',
    published: '2024-05-28',
    url: LAW,
}

describe('readAnnexAmendments', () => {
    it('finds the law that changes the annex, and not the one that only cites the code', () => {
        expect(readAnnexAmendments(root)).toEqual({
            amendments: [law],
            lastPublication: '2026-10-30',
            unreadable: [],
        })
    })

    it('reads nothing when etaamb was never fetched', () => {
        expect(readAnnexAmendments('test/fixtures/none')).toEqual({
            amendments: [],
            lastPublication: undefined,
            unreadable: [],
        })
    })
})

describe('a law page that is not laid out as one', () => {
    // An error page etaamb served with a 200, as a snapshot next to a day page
    const BROKEN = 'https://etaamb.openjustice.be/nl/wet-van-1-november-2026_n2026000003.html'
    const dir = mkdtempSync(join(tmpdir(), 'etaamb-'))
    const entry = (url: string, file: string) => ({
        url,
        status: 200,
        contentType: 'text/html; charset=utf-8',
        file,
        sha256: '',
        retrieved: '2026-11-05',
        checked: '2026-11-05',
    })
    mkdirSync(join(dir, 'etaamb'))
    writeFileSync(join(dir, 'etaamb', 'day.html'), '<main></main>')
    writeFileSync(join(dir, 'etaamb', 'law.html'), '<main><h2>Unsupported Url Error</h2></main>')
    writeFileSync(
        join(dir, 'etaamb', 'index.json'),
        JSON.stringify({
            source: 'etaamb',
            entries: [
                entry('https://etaamb.openjustice.be/nl/pub/2026/11/04.html', 'day.html'),
                entry(BROKEN, 'law.html'),
            ],
        }),
    )
    afterAll(() => {
        rmSync(dir, { recursive: true })
    })

    it('comes out of the reader as unreadable, and out of the signals as a line', () => {
        const read = readAnnexAmendments(dir)
        expect(read).toEqual({
            amendments: [],
            lastPublication: '2026-11-04',
            unreadable: [
                `${BROKEN}: not a law's page as etaamb lays one out (no numac, date or title)`,
            ],
        })
        expect(
            annexSignals({
                ...read,
                version: { eli: '', consolidatedTo: '2024-05-28' },
                today: '2026-11-05',
            }),
        ).toEqual([
            `annex: ${BROKEN}: not a law's page as etaamb lays one out (no numac, date or title): read it by hand`,
        ])
    })
})

describe('readAmendment', () => {
    const page = (body: string) =>
        `<main><h1 class="doc_title">Programmawet</h1><dl><dt>numac</dt><dd class="numac">2026000009</dd><dt>pub.</dt><dd class="date">30/10/2026</dd></dl>${body}</main>`
    const url = 'https://etaamb.openjustice.be/nl/programmawet-van-1-oktober-2026_n2026000009.html'

    it('reads a law that names the code first and then its annex as that of "hetzelfde Wetboek"', () => {
        expect(
            readAmendment(
                page(
                    '<p>Art. 4. Artikel 186 van het Gerechtelijk Wetboek wordt gewijzigd.</p><p>Art. 5. In artikel 1 van het bijvoegsel bij hetzelfde Wetboek</p>',
                ),
                url,
            ),
        ).toEqual({
            numac: '2026000009',
            title: 'Programmawet',
            published: '2026-10-30',
            url,
            uncertain: true,
        })
    })

    it('throws for a page that is not laid out as a law, whatever it cites', () => {
        expect(() => readAmendment('<main><h2>Unsupported Url Error</h2></main>', url)).toThrow(
            /not a law's page/,
        )
    })

    it("leaves a law that changes another code's annex", () => {
        expect(
            readAmendment(
                page('<p>Art. 5. In het bijvoegsel bij hetzelfde Wetboek van strafvordering</p>'),
                url,
            ),
        ).toBeUndefined()
    })
})

describe('annexSignals', () => {
    const today = '2026-11-05'

    it('says nothing when the cantons include the law', () => {
        expect(
            annexSignals({
                amendments: [law],
                lastPublication: '2026-11-04',
                version: { eli: '', consolidatedTo: '2024-05-28' },
                today,
            }),
        ).toEqual([])
    })

    it('reports a law published after the text the cantons were built from', () => {
        expect(
            annexSignals({
                amendments: [law],
                lastPublication: '2026-11-04',
                version: { eli: '', consolidatedTo: '2023-01-12' },
                today,
            }),
        ).toEqual([
            `annex: "${law.title}" (numac 2024004698, published 2024-05-28) changes the annex to the Judicial Code, and the cantons were built from its text up to 2023-01-12: ${LAW}`,
        ])
    })

    it('says so when etaamb went quiet or could not be read', () => {
        const version = { eli: '', consolidatedTo: '2024-05-28' }
        expect(
            annexSignals({ amendments: [], lastPublication: '2026-10-20', version, today }),
        ).toEqual([
            'annex: etaamb has published nothing since 2026-10-20, so a law that changes the annex may be missed',
        ])
        expect(
            annexSignals({ amendments: [], lastPublication: undefined, version, today }),
        ).toEqual([
            'annex: etaamb could not be read, so a law that changes the annex may be missed',
        ])
    })

    it('says "may" for a law that names the annex as that of "hetzelfde Wetboek"', () => {
        expect(
            annexSignals({
                amendments: [{ ...law, uncertain: true }],
                lastPublication: '2026-11-04',
                version: { eli: '', consolidatedTo: '2023-01-12' },
                today,
            }),
        ).toEqual([
            `annex: "${law.title}" (numac 2024004698, published 2024-05-28) names the Judicial Code and then the annex to "hetzelfde Wetboek", so it may change the annex to the Judicial Code, and the cantons were built from its text up to 2023-01-12: ${LAW}`,
        ])
    })

    it('says so once when many law pages could not be read', () => {
        expect(
            annexSignals({
                amendments: [],
                lastPublication: '2026-11-04',
                unreadable: ['a', 'b', 'c', 'd'],
                version: { eli: '', consolidatedTo: '2024-05-28' },
                today,
            }),
        ).toEqual([
            "annex: etaamb's law pages could not be read (its layout may have changed), so a law that changes the annex may be missed",
        ])
    })

    it('reports a law whose page it could not read, instead of stopping the build', () => {
        expect(
            annexSignals({
                amendments: [],
                lastPublication: '2026-11-04',
                unreadable: [`${LAW}: not a law's page as etaamb lays one out`],
                version: { eli: '', consolidatedTo: '2024-05-28' },
                today,
            }),
        ).toEqual([`annex: ${LAW}: not a law's page as etaamb lays one out: read it by hand`])
    })

    it('starts from the annex the cantons were built from', () => {
        expect(readAnnexVersion().consolidatedTo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})

describe('etaamb source', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('helpers read the day pages and the months', () => {
        expect(etaambDay('https://etaamb.openjustice.be/nl/pub/2026/09/30.html')).toBe('2026-09-30')
        expect(etaambDay('https://etaamb.openjustice.be/nl/pub/2026/09.html')).toBeUndefined()
        expect(months('2025-11-20', '2026-01-05')).toEqual(['2025/11', '2025/12', '2026/01'])
        const E = 'https://etaamb.openjustice.be/nl'
        expect(isEtaambLaw(`${E}/wet-van-15-mei-2024_n2024004698.html`)).toBe(true)
        expect(isEtaambLaw(`${E}/programmawet-van-22-december-2023_n2023048600.html`)).toBe(true)
        expect(isEtaambLaw(`${E}/bijzondere-wet-van-1-oktober-2026_n2026000004.html`)).toBe(true)
        expect(isEtaambLaw(`${E}/koninklijk-besluit-van-2-september-2026_n2026000002.html`)).toBe(
            false,
        )
        expect(isEtaambLaw(`${E}/decreet-van-2-september-2026_n2026000005.html`)).toBe(false)
        expect(
            dayList(
                `<a href="https://etaamb.openjustice.be/nl/wet-van-1_n2026000001.html" class="doclink day_list">
                 <a href="https://etaamb.openjustice.be/nl/wet-van-2_n1999000002.html" class="doclink int_list">`,
                'https://etaamb.openjustice.be/nl/pub/2026/10/30.html',
            ),
        ).toEqual(['https://etaamb.openjustice.be/nl/wet-van-1_n2026000001.html'])
    })

    it("fetches the window's days and only the laws they list", async () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-11-05T05:00:00Z'))
        const E = 'https://etaamb.openjustice.be/nl'
        const pages: Record<string, string> = {
            [`${E}/pub/2026/11.html`]: `<a href="${E}/pub/2026/11/04.html">4</a>`,
            [`${E}/pub/2026/10.html`]: `<a href="${E}/pub/2026/10/15.html">15</a>`,
            [`${E}/pub/2026/10/15.html`]: `<a href="${E}/decreet-van-3-oktober-2026_n2026000004.html" class="doclink day_list">`,
            [`${E}/pub/2026/09.html`]: `<a href="${E}/pub/2026/09/01.html">1</a><a href="${E}/pub/2026/09/30.html">30</a>`,
            [`${E}/pub/2026/09/30.html`]: `<a href="${E}/wet-van-1-september-2026_n2026000001.html" class="doclink day_list"><a href="${E}/koninklijk-besluit-van-2-september-2026_n2026000002.html" class="doclink day_list">`,
            [`${E}/pub/2026/11/04.html`]: `<a href="${E}/wet-van-1-november-2026_n2026000003.html" class="doclink day_list">`,
        }
        const fetched: string[] = []
        const get = (url: string): Promise<Response> => {
            fetched.push(url)
            return Promise.resolve({
                url,
                status: 200,
                contentType: 'text/html',
                body: Buffer.from(pages[url] ?? ''),
            })
        }
        await sources.find((s) => s.name === 'etaamb')?.fetch(get, () => 0)
        expect(fetched).toEqual([
            `${E}/pub/2026/09.html`,
            `${E}/pub/2026/10.html`,
            `${E}/pub/2026/11.html`,
            // 1 September is more than 60 days ago
            `${E}/pub/2026/09/30.html`,
            `${E}/pub/2026/10/15.html`,
            `${E}/pub/2026/11/04.html`,
            `${E}/wet-van-1-november-2026_n2026000003.html`,
            `${E}/wet-van-1-september-2026_n2026000001.html`,
        ])
    })

    // etaamb answers 200 for a month or a day it has nothing for: each list is held to what
    // the journal does, so one that comes back empty fails the walk and retires nothing
    const E = 'https://etaamb.openjustice.be/nl'
    const walk = (pages: Record<string, string>) => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-11-05T05:00:00Z'))
        const get = (url: string): Promise<Response> =>
            Promise.resolve({
                url,
                status: 200,
                contentType: 'text/html',
                body: Buffer.from(pages[url] ?? ''),
            })
        return sources.find((s) => s.name === 'etaamb')?.fetch(get, () => 0)
    }
    const monthPages = {
        [`${E}/pub/2026/09.html`]: `<a href="${E}/pub/2026/09/30.html">30</a>`,
        [`${E}/pub/2026/10.html`]: `<a href="${E}/pub/2026/10/15.html">15</a>`,
    }
    const decree = `<a href="${E}/decreet-van-3-oktober-2026_n2026000004.html" class="doclink day_list">`

    it('fails when a month that is over lists no days', async () => {
        await expect(
            walk({ [`${E}/pub/2026/09.html`]: `<a href="${E}/pub/2026/09/30.html">30</a>` }),
        ).rejects.toThrow('etaamb lists no days for 2026/10')
    })

    it('fails when a day lists no texts, as when its markup changed', async () => {
        await expect(
            walk({
                ...monthPages,
                [`${E}/pub/2026/09/30.html`]: decree,
                [`${E}/pub/2026/10/15.html`]: `<a class="doc" href="${E}/wet-van-1-oktober-2026_n2026000003.html">`,
            }),
        ).rejects.toThrow('etaamb lists no texts for 2026-10-15')
    })

    it('fails when the window lists no law at all', async () => {
        await expect(
            walk({
                ...monthPages,
                [`${E}/pub/2026/09/30.html`]: decree,
                [`${E}/pub/2026/10/15.html`]: decree,
            }),
        ).rejects.toThrow(/no laws/)
    })

    it("goes on when the running month hasn't published yet", async () => {
        await expect(
            walk({
                ...monthPages,
                [`${E}/pub/2026/09/30.html`]: `<a href="${E}/wet-van-1-september-2026_n2026000001.html" class="doclink day_list">`,
                [`${E}/pub/2026/10/15.html`]: decree,
            }),
        ).resolves.toBeUndefined()
    })
})
