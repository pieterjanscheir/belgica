import { describe, expect, expectTypeOf, it } from 'vitest'

import * as root from '../src'
import {
    arrondissementBoundaries,
    arrondissementBoundariesCoverage,
    findArrondissementsAt,
    getArrondissementBoundary,
    type ArrondissementBoundary,
} from '../src/arrondissement-boundaries'
import { cantonBoundaries, type Ring } from '../src/canton-boundaries'
import { NGI_CANTONS } from '../scripts/sources/catalog'
import { appliesOn, arrondissements, cantons } from '../src'
import { today as todayInBelgium } from '../src/time'

const today = todayInBelgium()
const current = arrondissementBoundaries.filter((b) => appliesOn(b, today))

/**
 * A point inside a polygon: the middle of the first span of a horizontal line through the
 * centre of the exterior ring's bounding box (as in test/canton-boundaries.test.ts, which
 * checks that it lies inside every canton)
 */
function interiorPoint([exterior = []]: Ring[]): [number, number] {
    const lats = exterior.map(([, lat]) => lat)
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2
    const crossings: number[] = []
    for (let i = 1; i < exterior.length; i++) {
        const [ax, ay] = exterior[i - 1] ?? [0, 0]
        const [bx, by] = exterior[i] ?? [0, 0]
        if (ay > lat !== by > lat) crossings.push(((bx - ax) * (lat - ay)) / (by - ay) + ax)
    }
    crossings.sort((a, b) => a - b)
    return [((crossings[0] ?? 0) + (crossings[1] ?? 0)) / 2, lat]
}

describe('arrondissement boundaries', () => {
    it('has one boundary for every arrondissement, and an arrondissement for every boundary', () => {
        expect(current.map((b) => b.id).sort()).toEqual(arrondissements.map((a) => a.id).sort())
        for (const b of arrondissementBoundaries) expect(b.arrondissement, b.id).toBe(b.id)
    })

    it("carries the NGI's object id, and cites the NGI file", () => {
        const ids = new Set(arrondissementBoundaries.map((b) => b.ngiId))
        expect(ids.size).toBe(arrondissementBoundaries.length)
        for (const b of arrondissementBoundaries) {
            expect(b.ngiId, b.id).toMatch(/^\{[0-9A-F]{8}(-[0-9A-F]{4}){3}-[0-9A-F]{12}\}$/)
            expect(
                b.sources.map((s) => s.url),
                b.id,
            ).toEqual([NGI_CANTONS])
        }
    })

    // The canton boundaries are checked against Belgium and against each other in
    // test/canton-boundaries.test.ts; a point inside a canton must be in its arrondissement only
    it('holds its own cantons, and no other', () => {
        const problems: string[] = []
        for (const b of cantonBoundaries) {
            const expected = cantons.find((c) => c.id === b.canton)?.arrondissement
            const [lon, lat] = interiorPoint(b.geometry.coordinates[0] ?? [])
            const found = findArrondissementsAt(lon, lat).map((a) => a.id)
            if (found.length !== 1 || found[0] !== expected)
                problems.push(`${b.id} (${expected}) is in ${found.join(', ') || 'none'}`)
        }
        expect(problems).toEqual([])
    })

    it('is only in its own entry point, not the package root', () => {
        expect('findArrondissementsAt' in root).toBe(false)
        expect('arrondissementBoundaries' in root).toBe(false)
    })
})

describe('getArrondissementBoundary', () => {
    it('finds the boundary of an arrondissement, by arrondissement id', () => {
        expect(getArrondissementBoundary('leuven').arrondissement).toBe('leuven')
        expect(
            getArrondissementBoundary('leuven', { on: arrondissementBoundariesCoverage.from })?.id,
        ).toBe('leuven')
        expect(getArrondissementBoundary('no-such-arrondissement')).toBeUndefined()
        expect(() => getArrondissementBoundary('leuven', { on: '2026-01-01' })).toThrow(RangeError)
    })

    it('types lookups by id', () => {
        expectTypeOf(getArrondissementBoundary('leuven')).toEqualTypeOf<ArrondissementBoundary>()
        expectTypeOf(getArrondissementBoundary('x' as string)).toEqualTypeOf<
            ArrondissementBoundary | undefined
        >()
    })
})

describe('findArrondissementsAt', () => {
    it.each([
        ['Sint-Baafskathedraal, Gent', 3.7268, 51.053, 'oost-vlaanderen'],
        ['Grote Markt, Leuven', 4.7005, 50.8792, 'leuven'],
        // Halle-Vilvoorde is in the province of Flemish Brabant, but the arrondissement of Brussels
        ['Grote Markt, Halle', 4.2372, 50.7339, 'brussel'],
        ['Grand-Place, Brussel', 4.3525, 50.8467, 'brussel'],
        ['Rathausplatz, Eupen', 6.0354, 50.6294, 'eupen'],
        ['Place Saint-Lambert, Liège', 5.5734, 50.6454, 'liege'],
    ])('%s is in arrondissement %s', (_place, lon, lat, arrondissement) => {
        expect(findArrondissementsAt(lon, lat).map((a) => a.id)).toEqual([arrondissement])
    })

    it('finds nothing outside Belgium', () => {
        expect(findArrondissementsAt(2.3522, 48.8566)).toEqual([]) // Paris
        expect(findArrondissementsAt(51.053, 3.7268)).toEqual([]) // latitude first
    })

    it('answers for a day, and throws before the coverage or for bad coordinates', () => {
        expect(
            findArrondissementsAt(3.745, 50.995, { on: arrondissementBoundariesCoverage.from }),
        ).toHaveLength(1)
        expect(() => findArrondissementsAt(3.745, 50.995, { on: '2025-06-01' })).toThrow(
            /2026-10-21 onwards/,
        )
        expect(() => findArrondissementsAt(NaN, 50)).toThrow(RangeError)
    })
})
