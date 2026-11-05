import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
    addIndexations,
    buildIndexations,
    cpiStatus,
    dueIndexations,
    readCpiSeries,
    toBase2004,
    type CpiMonth,
} from '../../scripts/parse/cpi.ts'
import { STATBEL_CPI, sources } from '../../scripts/sources/catalog.ts'
import { Store } from '../../scripts/sources/store.ts'
import { proceduralIndemnities } from '../../src/procedural-indemnities'

// The shapes of bestat facts rpv-calculator.be's parser of the same view handles, not a copy of
// a real response: the first scheduled run keeps one in the snapshots
describe('readCpiSeries', () => {
    it.each([
        [{ Maand: 'februari 2025', Consumptieprijsindex: '166.05' }],
        [{ Maand: '2025 Februari', Consumptieprijsindex: 166.05 }],
        [{ Month: 'February 2025', 'Consumer price index': '166,05' }],
        [{ Mois: 'février 2025', 'Indice des prix à la consommation': '166,05' }],
        [{ Jaar: '2025', Maand: 'februari', Consumptieprijsindex: '166.05' }],
        [{ Jaar: 2025, 'Maand (nr)': 2, Consumptieprijsindex: '166.05' }],
        [{ Periode: '2025-02', Index: '166.05' }],
        [{ Periode: '02/2025', Consumptieprijsindex: '166.05' }],
        [{ Periode: 202502, Consumptieprijsindex: 166.05 }],
    ])('reads %o', (fact) => {
        expect(readCpiSeries({ facts: [fact] }).series).toEqual([
            { month: '2025-02', index: 166.05 },
        ])
    })

    it('skips the health index and the inflation, and sorts the months', () => {
        const { series, unreadable } = readCpiSeries({
            facts: [
                {
                    Maand: 'maart 2025',
                    Gezondheidsindex: '170.1',
                    Inflatie: '3,1',
                    Index: '165.93',
                },
                { Maand: 'februari 2025', Consumptieprijsindex: '166.05' },
                { Maand: 'februari 2025', Consumptieprijsindex: '166.05' },
                { Maand: 'totaal' },
            ],
        })
        expect(series).toEqual([
            { month: '2025-02', index: 166.05 },
            { month: '2025-03', index: 165.93 },
        ])
        expect(unreadable).toBe(1)
    })

    it('throws for a response it can’t read', () => {
        expect(() => readCpiSeries({ rows: [] })).toThrow('no facts')
        expect(() => readCpiSeries(null)).toThrow('no facts')
        expect(() => readCpiSeries({ facts: [{ Foo: 'x', Bar: 1 }] })).toThrow('fields: Foo, Bar')
        expect(() =>
            readCpiSeries({
                facts: [
                    { Maand: 'februari 2025', Index: '166.05' },
                    { Maand: 'februari 2025', Index: '140' },
                ],
            }),
        ).toThrow('two values')
        expect(readCpiSeries({ facts: [] }).series).toEqual([])
    })
})

const series = (...months: [string, number][]): CpiMonth[] =>
    months.map(([month, index]) => ({ month, index }))
const data = proceduralIndemnities

describe('toBase2004', () => {
    it('keeps a series in base 2004: February 2025 is 166.05', () => {
        const s = series(['2025-02', 166.05], ['2026-10', 174.5])
        expect(toBase2004(s, data.indexations)).toEqual({ series: s, rescaled: false })
    })

    it('scales a series in another base to the anchor', () => {
        const result = toBase2004(series(['2025-02', 132.84], ['2026-10', 139.6]), data.indexations)
        expect(result.rescaled).toBe(true)
        expect(result.series).toEqual(series(['2025-02', 166.05], ['2026-10', 174.5]))
    })

    it('can’t check the base without the anchor’s month', () => {
        expect(toBase2004(series(['2026-10', 174.5]), data.indexations).problem).toContain(
            'no 2025-02',
        )
    })

    it('has nothing to check without an indexation by the formula', () => {
        const steps = data.indexations.filter((i) => i.method === 'steps')
        expect(toBase2004(series(['2026-10', 174.5]), steps).rescaled).toBe(false)
    })
})

describe('dueIndexations', () => {
    it('sets off nothing below the next threshold', () => {
        expect(dueIndexations(series(['2025-02', 166.05], ['2026-10', 174.5]), data)).toEqual([])
    })

    it('sets off an indexation from the first day of the next month, at 175.78', () => {
        expect(
            dueIndexations(
                series(['2026-10', 174.5], ['2026-11', 175.78], ['2026-12', 176.4]),
                data,
            ),
        ).toEqual([
            {
                from: '2026-12-01',
                method: 'formula',
                threshold: 175.78,
                index: 175.78,
                note: 'Het indexcijfer van 2026-11 (Statbel, basis 2004) bereikte 175,78',
            },
        ])
    })

    it('goes down too, at 155.78, and across the turn of the year', () => {
        expect(dueIndexations(series(['2026-12', 155.7]), data)).toMatchObject([
            { from: '2027-01-01', threshold: 155.78, index: 155.7 },
        ])
    })

    it('climbs the ladder: one rung, then the next, or two at once', () => {
        expect(
            dueIndexations(series(['2027-01', 176.1], ['2027-02', 180], ['2028-05', 186.2]), data),
        ).toMatchObject([
            { from: '2027-02-01', threshold: 175.78 },
            { from: '2028-06-01', threshold: 185.78 },
        ])
        expect(dueIndexations(series(['2027-01', 196]), data)).toMatchObject([
            { threshold: 195.78 },
        ])
    })

    it('ignores the months up to the last indexation’s own', () => {
        expect(dueIndexations(series(['2022-09', 200], ['2025-02', 166.05]), data)).toEqual([])
    })

    it('has nothing to do without an indexation on file', () => {
        expect(dueIndexations(series(['2027-01', 196]), { ...data, indexations: [] })).toEqual([])
        expect(cpiStatus(series(['2027-01', 196]), { indexations: [] })).toBeUndefined()
    })
})

describe('cpiStatus', () => {
    it('says where the index stands', () => {
        expect(cpiStatus(series(['2026-10', 174.5]), data)).toBe(
            'cpi: 2026-10 is 174.5; the next indexation comes at 175.78 (or 155.78 on the way down)',
        )
    })
})

describe('buildIndexations', () => {
    let root = ''
    afterEach(() => {
        rmSync(root, { recursive: true, force: true })
    })
    const snapshot = (status: number, body: unknown) => {
        rmSync(root, { recursive: true, force: true })
        root = mkdtempSync(join(tmpdir(), 'cpi-'))
        const store = new Store(root, 'cpi')
        store.put(STATBEL_CPI, {
            url: STATBEL_CPI,
            status,
            contentType: 'application/json',
            body: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)),
        })
        store.save({ prune: true })
    }

    it('reads the snapshot and says what is due', () => {
        snapshot(200, {
            facts: [
                { Maand: 'februari 2025', Consumptieprijsindex: '166.05' },
                { Maand: 'november 2026', Consumptieprijsindex: '175.9' },
                { Maand: 'onbekend' },
            ],
        })
        const result = buildIndexations(root, data)
        expect(result.problems).toEqual([])
        expect(result.due).toMatchObject([{ from: '2026-12-01', threshold: 175.78, index: 175.9 }])
        expect(result.notes).toContain('cpi: 1 facts without a month and an index')
    })

    it('says when it had to scale the series', () => {
        snapshot(200, { facts: [{ Periode: '2025-02', Index: '132.84' }] })
        expect(buildIndexations(root, data).notes).toContain(
            'cpi: Statbel serves another base; the index was scaled to base 2004',
        )
    })

    it('stops the build for a response it can’t read, or a base it can’t check', () => {
        snapshot(200, 'not json')
        expect(buildIndexations(root, data).problems).toHaveLength(1)
        snapshot(200, { facts: [{ Periode: '2026-10', Index: '174.5' }] })
        expect(buildIndexations(root, data).problems[0]).toContain('no 2025-02')
    })

    it('does nothing without a good snapshot', () => {
        root = mkdtempSync(join(tmpdir(), 'cpi-'))
        expect(buildIndexations(root, data)).toEqual({
            due: [],
            problems: [],
            notes: ['cpi: no snapshot of the index yet'],
        })
        snapshot(503, 'down')
        expect(buildIndexations(root, data).notes).toEqual([
            'cpi: the last fetch of the index failed',
        ])
    })
})

describe('cpi source', () => {
    it('fetches the bestat view', async () => {
        const fetched: string[] = []
        await sources
            .find((s) => s.name === 'cpi')
            ?.fetch(
                (url) => {
                    fetched.push(url)
                    return Promise.resolve({
                        url,
                        status: 200,
                        contentType: 'application/json',
                        body: Buffer.from('{}'),
                    })
                },
                () => 0,
            )
        expect(fetched).toEqual([STATBEL_CPI])
    })
})

describe('addIndexations', () => {
    const file = 'data/procedural-indemnities.json'
    const text = readFileSync(file, 'utf8')
    const due = dueIndexations(series(['2026-11', 175.9]), data)

    it('adds the lines at the end of the indexations, and changes nothing else', async () => {
        const updated = await addIndexations(text, due, file)
        expect((JSON.parse(updated) as typeof data).indexations).toEqual([
            ...data.indexations,
            ...due,
        ])
        const before = text.split('\n')
        const after = updated.split('\n')
        // The file up to the last indexation's closing brace is the same
        const last = before.lastIndexOf('    }')
        expect(after.slice(0, last)).toEqual(before.slice(0, last))
        expect(after.length - before.length).toBeLessThan(12)
    })

    it('throws when the indexations aren’t the last array of the file', async () => {
        await expect(addIndexations(text + '[]', due, file)).rejects.toThrow()
        const moved = text.replace(/\n}\n$/, ',\n  "extra": ["x"]\n}\n')
        await expect(addIndexations(moved, due, file)).rejects.toThrow("didn't land")
    })
})
