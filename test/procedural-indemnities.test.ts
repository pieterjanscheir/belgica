import { describe, expect, it } from 'vitest'

import { proceduralIndemnityTariffIdSchema } from '../src/schemas'
import {
    getProceduralIndemnity,
    getProceduralIndemnityIndexation,
    getProceduralIndemnityTable,
    getProceduralIndemnityTariff,
    indexProceduralIndemnity,
    proceduralIndemnities,
    type ProceduralIndemnityTariffId,
} from '../src/procedural-indemnities'

const { tariffs, indexations } = proceduralIndemnities

/**
 * The amounts from 1 March 2025 as the College van de hoven en rechtbanken publishes them
 * (bedrag-van-de-rechtsplegingsvergoeding.pdf on rechtbanken-tribunaux.be): [min, base, max]
 * per bracket, lowest first, then the claim that can't be valued in money. Copied from the
 * table, never computed, so they check the formula and the rounding independently.
 */
const PUBLISHED_2025_03_01: Record<ProceduralIndemnityTariffId, number[][]> = {
    general: [
        [117.73, 235.47, 470.93],
        [196.22, 313.95, 784.88],
        [313.95, 627.91, 1569.77],
        [588.66, 1020.35, 2354.65],
        [784.88, 1412.79, 3139.53],
        [981.1, 1726.74, 3924.42],
        [1569.77, 3139.53, 6279.07],
        [1569.77, 3924.42, 7848.84],
        [1569.77, 4709.3, 9418.6],
        [1569.77, 7848.84, 15697.67],
        [1569.77, 10988.37, 21976.74],
        [1569.77, 15697.67, 31395.35],
        [1569.77, 23546.51, 47093.02],
        [117.73, 1883.72, 15697.67],
    ],
    'labour-court-president': [
        [41.54, 57.23, 72.93],
        [41.54, 57.23, 72.93],
        [41.54, 57.23, 72.93],
        [90.83, 114.37, 137.92],
        [41.54, 57.23, 72.93],
    ],
    'labour-court': [
        [41.54, 57.23, 72.93],
        [90.83, 114.37, 137.92],
        [140.21, 171.61, 203],
        [296.12, 343.21, 390.31],
        [140.21, 171.61, 203],
    ],
    'labour-court-of-appeal': [
        [60.61, 76.31, 92],
        [128.99, 152.53, 176.08],
        [189.6, 228.84, 252.39],
        [394.8, 457.59, 520.38],
        [189.6, 228.84, 252.39],
    ],
}

describe('procedural indemnity data', () => {
    it('has every tariff once', () => {
        expect(tariffs.map((t) => t.id)).toEqual(proceduralIndemnityTariffIdSchema.options)
    })

    it.each(tariffs.map((t) => [t.id, t] as const))(
        '%s has rising brackets, the last without an upper limit',
        (_id, tariff) => {
            const limits = tariff.brackets.map((b) => b.upTo)
            expect(limits.at(-1)).toBeNull()
            const finite = limits.slice(0, -1)
            expect(finite).not.toContain(null)
            expect(finite).toEqual([...finite].sort((a, b) => (a ?? 0) - (b ?? 0)))
            expect(new Set(finite).size).toBe(finite.length)
            for (const amounts of [...tariff.brackets, tariff.nonMonetary]) {
                expect(amounts.min <= amounts.base && amounts.base <= amounts.max).toBe(true)
            }
        },
    )

    it('has the indexations oldest first, from 1 January 2008, each on the 1st of a month', () => {
        expect(indexations[0]).toMatchObject({ from: '2008-01-01', method: 'steps', multiplier: 1 })
        for (const [i, indexation] of indexations.entries()) {
            expect(indexation.from.slice(8), indexation.from).toBe('01')
            const previous = indexations[i - 1]
            if (previous) expect(previous.from < indexation.from, indexation.from).toBe(true)
        }
    })

    it('has every threshold on the ladder of 10 points from the start index', () => {
        for (const { threshold, from } of indexations) {
            const steps = (threshold - proceduralIndemnities.startIndex) / 10
            expect(Math.abs(steps - Math.round(steps)), from).toBeLessThan(1e-9)
        }
    })

    it('uses the steps of 10 % before the KB of 16 May 2024, and its formula after', () => {
        for (const indexation of indexations) {
            if (indexation.method === 'steps') {
                expect(indexation.from < '2024-06-06', indexation.from).toBe(true)
                const steps = (indexation.threshold - proceduralIndemnities.startIndex) / 10
                expect(indexation.multiplier, indexation.from).toBeCloseTo(1 + steps / 10, 9)
            } else {
                expect(indexation.from > '2024-06-06', indexation.from).toBe(true)
                expect(indexation.index, indexation.from).toBeGreaterThanOrEqual(
                    indexation.threshold,
                )
            }
        }
    })
})

describe('getProceduralIndemnityIndexation', () => {
    it('gives the indexation in force on a day', () => {
        expect(getProceduralIndemnityIndexation('2008-01-01')?.from).toBe('2008-01-01')
        expect(getProceduralIndemnityIndexation('2022-10-31')?.from).toBe('2022-04-01')
        expect(getProceduralIndemnityIndexation('2022-11-01')?.from).toBe('2022-11-01')
        expect(getProceduralIndemnityIndexation('2025-02-28')?.from).toBe('2022-11-01')
        expect(getProceduralIndemnityIndexation(new Date(2025, 2, 1))).toMatchObject({
            from: '2025-03-01',
            method: 'formula',
            index: 166.05,
        })
    })

    it('gives null before the KB came into force', () => {
        expect(getProceduralIndemnityIndexation('2007-12-31')).toBeNull()
    })

    it('throws for an invalid day', () => {
        expect(() => getProceduralIndemnityIndexation('2025-02-30')).toThrow(RangeError)
    })
})

describe('indexProceduralIndemnity', () => {
    const steps = (multiplier: number) =>
        ({ from: '2011-03-01', method: 'steps', threshold: 115.78, multiplier }) as const

    it('rounds to the cent, half a cent up', () => {
        expect(indexProceduralIndemnity(26.46, steps(1.1))).toBe(29.11) // 29.106
        expect(indexProceduralIndemnity(0.05, steps(1.1))).toBe(0.06) // 0.055
        expect(indexProceduralIndemnity(150, steps(1.5))).toBe(225)
    })

    it('multiplies by the new index and divides by the start index under the formula', () => {
        const formula = {
            from: '2025-03-01',
            method: 'formula',
            threshold: 165.78,
            index: 166.05,
        } as const
        expect(indexProceduralIndemnity(150, formula)).toBe(235.47) // 235.4651…
        expect(indexProceduralIndemnity(105.78, formula)).toBe(166.05)
    })
})

describe('getProceduralIndemnityTable', () => {
    it.each(Object.entries(PUBLISHED_2025_03_01))(
        'gives the published %s amounts of 1 March 2025 to the cent',
        (tariff, rows) => {
            const table = getProceduralIndemnityTable('2025-03-01', {
                tariff: tariff as ProceduralIndemnityTariffId,
            })
            const amounts = [...(table?.brackets ?? []), table?.nonMonetary].map((a) => [
                a?.min,
                a?.base,
                a?.max,
            ])
            expect(amounts).toEqual(rows)
        },
    )

    it('gives each bracket its range', () => {
        const brackets = getProceduralIndemnityTable('2026-01-01')?.brackets ?? []
        expect(brackets[0]).toMatchObject({ above: null, upTo: 250 })
        expect(brackets[1]).toMatchObject({ above: 250, upTo: 750 })
        expect(brackets.at(-1)).toMatchObject({ above: 1_000_000, upTo: null })
    })

    it('gives the amounts of the KB until the first indexation', () => {
        const table = getProceduralIndemnityTable('2010-06-30')
        expect(table?.brackets[0]).toMatchObject({ min: 75, base: 150, max: 300 })
        expect(table?.nonMonetary).toEqual({ min: 75, base: 1200, max: 10_000 })
    })

    it('gives null before 2008, and throws for an unknown tariff', () => {
        expect(getProceduralIndemnityTable('2007-06-01')).toBeNull()
        expect(() =>
            getProceduralIndemnityTable('2025-03-01', {
                tariff: 'police-court' as ProceduralIndemnityTariffId,
            }),
        ).toThrow(RangeError)
    })
})

describe('getProceduralIndemnity', () => {
    it('finds the bracket of a claim, both limits included', () => {
        expect(getProceduralIndemnity(250, '2025-03-01')).toMatchObject({
            bracket: { above: null, upTo: 250 },
            base: 235.47,
        })
        expect(getProceduralIndemnity(250.01, '2025-03-01')).toMatchObject({
            bracket: { above: 250, upTo: 750 },
            base: 313.95,
        })
        expect(getProceduralIndemnity(0, '2025-03-01')?.bracket?.upTo).toBe(250)
        expect(getProceduralIndemnity(5_000_000, '2025-03-01')).toMatchObject({
            bracket: { above: 1_000_000, upTo: null },
            min: 1569.77,
            base: 23546.51,
            max: 47093.02,
        })
    })

    it('uses the tariff asked for', () => {
        const result = getProceduralIndemnity(249.99, '2025-03-01', { tariff: 'labour-court' })
        expect(result).toMatchObject({ tariff: 'labour-court', min: 41.54, base: 57.23 })
        expect(
            getProceduralIndemnity(250, '2025-03-01', { tariff: 'labour-court' })?.bracket,
        ).toEqual({ above: 249.99, upTo: 619.99 })
    })

    it('gives the non-monetary amounts for null', () => {
        expect(getProceduralIndemnity(null, '2025-03-01')).toMatchObject({
            tariff: 'general',
            bracket: null,
            min: 117.73,
            base: 1883.72,
            max: 15697.67,
        })
    })

    it('uses the indexation of the day', () => {
        expect(getProceduralIndemnity(10_000, '2011-02-28')?.base).toBe(900)
        expect(getProceduralIndemnity(10_000, '2011-03-01')?.base).toBe(990) // 900 × 1.1
        expect(getProceduralIndemnity(10_000, '2016-05-31')?.base).toBe(990)
        expect(getProceduralIndemnity(10_000, '2022-11-01')?.base).toBe(1350) // 900 × 1.5
        expect(getProceduralIndemnity(10_000, '2025-03-01')?.base).toBe(1412.79)
        expect(getProceduralIndemnity(10_000, '2007-12-31')).toBeNull()
    })

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('throws for a claim of %s', (claim) => {
        expect(() => getProceduralIndemnity(claim, '2025-03-01')).toThrow(RangeError)
    })
})

describe('getProceduralIndemnityTariff', () => {
    it('gives a tariff with the amounts of the KB, or undefined', () => {
        expect(getProceduralIndemnityTariff('general').nonMonetary.base).toBe(1200)
        expect(getProceduralIndemnityTariff('labour-court-of-appeal').name.nl).toBe('Arbeidshof')
        expect(getProceduralIndemnityTariff('unknown')).toBeUndefined()
    })
})
