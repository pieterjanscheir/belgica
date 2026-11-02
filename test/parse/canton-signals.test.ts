import { describe, expect, it } from 'vitest'

import { cantonSignals } from '../../scripts/parse/canton-signals.ts'
import type { RefnisRow } from '../../scripts/parse/refnis.ts'
import type { CantonBoundary } from '../../scripts/parse/types.ts'
import type { Municipality } from '../../src/territory.ts'

const square = (size: number) => ({
    type: 'MultiPolygon' as const,
    coordinates: [
        [
            [
                [4, 50],
                [4 + size, 50],
                [4 + size, 50 + size],
                [4, 50],
            ] as [number, number][],
        ],
    ],
})
const boundary = (id: string, size: number) =>
    ({ id, canton: id, geometry: square(size) }) as unknown as CantonBoundary
const row = (code: string, nl: string, to?: string): RefnisRow => ({
    level: 4,
    code,
    parent: '44000',
    name: { nl, fr: nl, de: nl },
    from: '1977-01-01',
    to,
})
const municipality = (id: string, nl: string) =>
    ({ id, name: { nl, fr: nl }, province: '40000', region: '02000' }) as unknown as Municipality

const today = '2026-11-02'

describe('cantonSignals', () => {
    it('says nothing when the boundaries and the register match the data', () => {
        expect(
            cantonSignals({
                previousBoundaries: [boundary('gent-1', 1)],
                boundaries: [boundary('gent-1', 1)],
                refnis: [row('44021', 'Gent')],
                municipalities: [municipality('44021', 'Gent')],
                today,
            }),
        ).toEqual([])
    })

    it("reports a canton whose NGI boundary changed, but not a canton that's new", () => {
        expect(
            cantonSignals({
                previousBoundaries: [boundary('gent-1', 1)],
                boundaries: [boundary('gent-1', 2), boundary('gent-9', 1)],
                refnis: [],
                municipalities: [],
                today,
            }),
        ).toEqual(["canton gent-1: the NGI's boundary changed"])
    })

    it('reports municipalities that Statbel opened or closed and the data has not caught up with', () => {
        expect(
            cantonSignals({
                previousBoundaries: [],
                boundaries: [],
                refnis: [
                    row('44021', 'Gent'),
                    row('44084', 'Lievegem'),
                    row('44019', 'Evergem', '2025-12-31'),
                ],
                municipalities: [municipality('44021', 'Gent'), municipality('44019', 'Evergem')],
                today,
            }),
        ).toEqual([
            "municipality 44084 (Lievegem): in Statbel's register, not in the data",
            "municipality 44019 (Evergem): in the data, no longer in Statbel's register",
        ])
    })
})
