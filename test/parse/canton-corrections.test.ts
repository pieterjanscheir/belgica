// The canton corrections: on squares, where what moves can be worked out by hand, and on the
// outline of Mariakerke kept in scripts/parse/corrections/
import { describe, expect, it } from 'vitest'

import { area } from '../../scripts/parse/boundaries.ts'
import {
    applyCorrections,
    CANTON_CORRECTIONS,
    readCorrectionArea,
    type CantonCorrection,
} from '../../scripts/parse/canton-corrections.ts'
import { lambert2008ToWgs84 } from '../../scripts/parse/lambert.ts'
import type { CantonBoundary, MultiPolygon } from '../../scripts/parse/types.ts'
import { getCantonBoundary } from '../../src/canton-boundaries'

const box = (x0: number, y0: number, x1: number, y1: number): MultiPolygon => ({
    type: 'MultiPolygon',
    coordinates: [
        [
            [
                [x0, y0],
                [x1, y0],
                [x1, y1],
                [x0, y1],
                [x0, y0],
            ],
        ],
    ],
})

const boundary = (id: string, geometry: MultiPolygon): CantonBoundary => ({
    id,
    canton: id,
    ngiId: '{00000000-0000-0000-0000-000000000000}',
    cantonCode: { nl: '000000', fr: '000000' },
    geometry,
    sources: [{ url: 'https://example.org/ngi', retrieved: '2026-10-21' }],
})

/** The boundary of a canton in a result, by id */
const of = (boundaries: readonly CantonBoundary[], id: string) => {
    const found = boundaries.find((b) => b.id === id)
    if (!found) throw new Error(`no boundary ${id}`)
    return found
}

const correction: CantonCorrection = {
    from: 'a',
    to: 'b',
    subMunicipality: { code: 'X', name: 'Middle' },
    law: { title: 'A law', url: 'https://example.org/law' },
}

describe('applyCorrections', () => {
    // a holds [0, 2] × [0, 1], b holds [2, 3] × [0, 1]; the law moves [1, 2] × [0, 1] to b
    const a = boundary('a', box(0, 0, 2, 1))
    const b = boundary('b', box(2, 0, 3, 1))
    const other = boundary('c', box(5, 5, 6, 6))

    it('moves the area from one canton to the other, and leaves the rest alone', () => {
        const result = applyCorrections([a, b, other], [correction], () => box(1, 0, 2, 1))
        const from = of(result.boundaries, 'a')
        const to = of(result.boundaries, 'b')
        expect(result.problems).toEqual([])
        expect(result.notes).toEqual([
            expect.stringMatching(/^Middle \(a → b, A law\): moved 100\.0%/),
        ])
        expect(area(from.geometry)).toBeCloseTo(1)
        expect(area(to.geometry)).toBeCloseTo(2)
        expect(from.geometry.coordinates).toHaveLength(1)
        expect(to.geometry.coordinates).toHaveLength(1)
        expect(of(result.boundaries, 'c')).toBe(other)
        expect(to.sources.map((s) => s.url)).toEqual([
            'https://example.org/ngi',
            'https://example.org/law',
            expect.stringContaining('statbel.fgov.be'),
        ])
    })

    it('moves only what lies in the from canton, so the cantons don’t overlap', () => {
        // The outline reaches into b already, as where the NGI's line and Statbel's differ
        const { boundaries } = applyCorrections([a, b], [correction], () => box(1, 0, 2.5, 1))
        expect(boundaries.reduce((sum, x) => sum + area(x.geometry), 0)).toBeCloseTo(3)
        expect(area(of(boundaries, 'b').geometry)).toBeCloseTo(2)
    })

    it('gives the slivers the cut leaves behind to the canton the area goes to', () => {
        // The outline stops a hair short of b's line: the strip between is a's no longer
        const { boundaries } = applyCorrections([a, b], [correction], () => box(1, 0, 1.999, 1))
        expect(area(of(boundaries, 'a').geometry)).toBeCloseTo(1, 6)
        expect(of(boundaries, 'a').geometry.coordinates).toHaveLength(1)
        expect(area(of(boundaries, 'b').geometry)).toBeCloseTo(2, 6)
    })

    it('says when the NGI has caught up, and changes nothing', () => {
        const caughtUp = boundary('b', box(1, 0, 3, 1))
        const before = boundary('a', box(0, 0, 1, 1))
        const result = applyCorrections([before, caughtUp], [correction], () => box(1, 0, 2, 1))
        expect(result.boundaries).toEqual([before, caughtUp])
        expect(result.notes).toEqual([expect.stringMatching(/remove the correction/)])
    })

    it('refuses to leave nothing of the from canton', () => {
        const result = applyCorrections([a, b], [correction], () => box(-1, -1, 2, 2))
        expect(result.boundaries).toEqual([a, b])
        expect(result.problems).toEqual([expect.stringMatching(/nothing of a would be left/)])
    })

    it('skips a canton without a boundary: the build reports it as missing', () => {
        const result = applyCorrections([a], [correction], () => box(1, 0, 2, 1))
        expect(result).toEqual({ boundaries: [a], notes: [], problems: [] })
    })
})

describe('the corrections', () => {
    it('have an outline for each sub-municipality, in WGS 84 around its place', () => {
        for (const { subMunicipality } of CANTON_CORRECTIONS) {
            const outline = readCorrectionArea(subMunicipality.code)
            expect(outline.type).toBe('MultiPolygon')
            for (const [lon, lat] of outline.coordinates.flat(2)) {
                expect(lon).toBeGreaterThan(2.5)
                expect(lon).toBeLessThan(6.5)
                expect(lat).toBeGreaterThan(49.4)
                expect(lat).toBeLessThan(51.6)
            }
        }
    })

    it('put Mariakerke in Gent 3, as the law of 15 May 2024 does', () => {
        // Mariakerke is about 8 km²; at Gent's latitude a square degree is about 7,800 km²
        const mariakerke = readCorrectionArea('44021L')
        expect(area(mariakerke) * 7800).toBeGreaterThan(6)
        expect(area(mariakerke) * 7800).toBeLessThan(10)
        expect(getCantonBoundary('gent-3').sources.map((s) => s.url)).toContain(
            'https://www.ejustice.just.fgov.be/eli/wet/2024/05/15/2024004698/justel',
        )
    })
})

describe('lambert2008ToWgs84', () => {
    it('maps the projection’s origin to its latitude and longitude', () => {
        // EPSG:3812: 50°47'52.134"N, 4°21'33.177"E at (649328, 665262)
        const [lon, lat] = lambert2008ToWgs84([649328, 665262])
        expect(lon).toBeCloseTo(4 + 21 / 60 + 33.177 / 3600, 9)
        expect(lat).toBeCloseTo(50 + 47 / 60 + 52.134 / 3600, 9)
    })

    it('keeps a metre a metre: 1 km north is about 0.009° of latitude', () => {
        const [, lat0] = lambert2008ToWgs84([649328, 665262])
        const [, lat1] = lambert2008ToWgs84([649328, 666262])
        expect((lat1 - lat0) * 111_250).toBeCloseTo(1000, -1)
    })
})
