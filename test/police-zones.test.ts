import { describe, expect, expectTypeOf, it } from 'vitest'

import { appliesOn, municipalities, toDay } from '../src'
import {
    findPoliceZone,
    getPoliceZone,
    getPoliceZoneMunicipalities,
    policeZones,
    policeZonesCoverage,
    type PoliceZone,
} from '../src/police-zones'

const today = toDay(new Date())
const current = policeZones.filter((z) => appliesOn(z, today))

describe('police zones', () => {
    it('are the 175 zones FOD Financiën publishes, each by its four-digit number', () => {
        expect(current).toHaveLength(175)
        for (const zone of policeZones) expect(zone.id, zone.id).toMatch(/^\d{4}$/)
        const ids = current.map((z) => z.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('put every municipality in exactly one zone', () => {
        const seen = current.flatMap((z) => z.municipalities)
        expect(new Set(seen).size).toBe(seen.length)
        expect(seen.sort()).toEqual(
            municipalities
                .filter((m) => appliesOn(m, today))
                .map((m) => m.id)
                .sort(),
        )
    })

    it('find a zone by its number or by a municipality', () => {
        const gent = getPoliceZone('5415')
        expect(gent.name).toEqual({ nl: 'GENT', fr: 'GAND', de: 'GENT' })
        expectTypeOf(gent).toEqualTypeOf<PoliceZone>()
        expect(findPoliceZone('44021')?.id).toBe('5415')
        expect(findPoliceZone('11001')?.name.nl).toBe('AARTSELAAR/EDEGEM/HOVE/KONTICH/LINT')
        expect(getPoliceZone('5403').alias).toBe('RODE')
    })

    it('list the municipalities a zone covers', () => {
        expect(getPoliceZoneMunicipalities('5349').map((m) => m.name.nl)).toEqual([
            'Aartselaar',
            'Edegem',
            'Hove',
            'Kontich',
            'Lint',
        ])
    })

    it('answer nothing for an unknown number or municipality', () => {
        expect(getPoliceZone('0000')).toBeUndefined()
        expect(findPoliceZone('99999')).toBeUndefined()
        expect(getPoliceZoneMunicipalities('0000')).toEqual([])
    })

    it("throw for a day before the data's coverage", () => {
        expect(() => findPoliceZone('44021', { on: '2020-01-01' })).toThrow(RangeError)
        expect(policeZonesCoverage.from).toBe('2026-11-02')
    })
})
