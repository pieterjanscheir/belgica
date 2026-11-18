import { describe, expect, expectTypeOf, it } from 'vitest'

import {
    appliesOn,
    courts,
    findCourtsWithJurisdiction,
    findCourtsForPostalCode,
    findJusticesOfThePeace,
    getArrondissement,
    getArrondissementForMunicipality,
    getMunicipalitiesForPostalCode,
    getMunicipality,
    getPostalCode,
    getPostalCodes,
    housesOfJustice,
    municipalities,
    postalCodes,
    postalCodesCoverage,
    prisons,
    type Address,
    type PostalCode,
} from '../src'
import { today as todayInBelgium } from '../src/time'

const today = todayInBelgium()
const current = postalCodes.filter((p) => appliesOn(p, today))

describe('postal codes', () => {
    it('are the pairs Statbel publishes: one record per postal code and municipality', () => {
        for (const p of postalCodes) {
            expect(p.postalCode, p.id).toMatch(/^\d{4}$/)
            expect(p.id, p.id).toBe(`${p.postalCode}-${p.municipality}`)
        }
        const keys = postalCodes.map((p) => `${p.id}|${p.validFrom ?? ''}`)
        expect(new Set(keys).size).toBe(keys.length)
        const ids = current.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('link every record to a municipality that exists on the same days', () => {
        for (const p of postalCodes) {
            expect(getMunicipality(p.municipality, { on: p.validFrom ?? today })?.id, p.id).toBe(
                p.municipality,
            )
        }
    })

    it('give every municipality at least one postal code', () => {
        const covered = new Set(current.map((p) => p.municipality))
        for (const m of municipalities.filter((m) => appliesOn(m, today)))
            expect(covered, `${m.name.nl} (${m.id})`).toContain(m.id)
    })

    it('share three postal codes between two municipalities, as the table says', () => {
        const byCode = new Map<string, string[]>()
        for (const p of current)
            byCode.set(p.postalCode, [...(byCode.get(p.postalCode) ?? []), p.municipality])
        const shared = [...byCode].filter(([, ids]) => ids.length > 1)
        expect(shared).toEqual([
            ['1040', ['21004', '21005']], // Brussel, Etterbeek
            ['1050', ['21004', '21009']], // Brussel, Elsene
            ['1804', ['23088', '23096']], // Vilvoorde, Zemst
        ])
        expect(byCode.size).toBeGreaterThan(1100)
    })
})

describe('getMunicipalitiesForPostalCode', () => {
    it('finds the municipality of a postal code, the same record the territory gives', () => {
        const [gent] = getMunicipalitiesForPostalCode('9000')
        expect(gent?.name).toEqual({ nl: 'Gent', fr: 'Gand' })
        expect(gent).toBe(getMunicipality('44021'))
        expect(getMunicipalitiesForPostalCode('9050').map((m) => m.id)).toEqual(['44021'])
    })

    it('gives both municipalities of a shared code, never one of them', () => {
        expect(getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl)).toEqual([
            'Brussel',
            'Etterbeek',
        ])
    })

    it('returns an empty list for an unknown code', () => {
        expect(getMunicipalitiesForPostalCode('0000')).toEqual([])
        expect(getMunicipalitiesForPostalCode('9000 ')).toEqual([])
    })

    it('answers for a day within the coverage, and throws before it', () => {
        expect(postalCodesCoverage.from).toBe('2025-01-01')
        expect(getMunicipalitiesForPostalCode('9000', { on: '2025-01-01' })).toHaveLength(1)
        expect(() => getMunicipalitiesForPostalCode('9000', { on: '2024-12-31' })).toThrow(
            RangeError,
        )
    })

    it('returns copies, so callers cannot change the shared data', () => {
        getMunicipalitiesForPostalCode('1040').pop()
        expect(getMunicipalitiesForPostalCode('1040')).toHaveLength(2)
    })
})

describe('getPostalCodes', () => {
    it('lists the postal codes of a municipality in order', () => {
        const codes = getPostalCodes('44021').map((p) => p.postalCode)
        expect(codes).toContain('9000')
        expect(codes).toEqual([...codes].sort())
        expect(codes.length).toBeGreaterThan(5)
        for (const p of getPostalCodes('21005')) expect(p.municipality).toBe('21005')
    })

    it('returns an empty list for an unknown municipality', () => {
        expect(getPostalCodes('99999')).toEqual([])
    })

    it('answers for a day', () => {
        expect(getPostalCodes('44021', { on: new Date(2026, 0, 1) }).length).toBeGreaterThan(5)
        expect(() => getPostalCodes('44021', { on: '2024-06-01' })).toThrow(/2025-01-01 onwards/)
    })
})

describe('getPostalCode', () => {
    it('finds a record by id, and nothing for an unknown id', () => {
        expect(getPostalCode('9000-44021')).toMatchObject({
            postalCode: '9000',
            municipality: '44021',
        })
        expect(getPostalCode('9000-44021', { on: '2025-06-01' })?.id).toBe('9000-44021')
        expect(getPostalCode('9000')).toBeUndefined()
        expectTypeOf(getPostalCode('9000-44021')).toEqualTypeOf<PostalCode>()
        expectTypeOf(getPostalCode('9000-44021', { on: '2025-06-01' })).toEqualTypeOf<
            PostalCode | undefined
        >()
    })
})

describe('findCourtsForPostalCode', () => {
    it('chains a postal code to the justices of the peace and the courts with jurisdiction', () => {
        const result = findCourtsForPostalCode('9050', 'labour-court')
        expect(result).toHaveLength(1)
        const [gent] = result
        expect(gent?.municipality.id).toBe('44021')
        expect(gent?.justicesOfThePeace).toEqual(findJusticesOfThePeace('44021'))
        expect(gent?.justicesOfThePeace.map((c) => c.canton.id)).toEqual([
            'gent-1',
            'gent-2',
            'gent-3',
            'gent-4',
            'gent-5',
        ])
        expect(gent?.courts).toEqual(findCourtsWithJurisdiction('44021', 'labour-court'))
        expect(gent?.courts.map((c) => c.id)).toEqual(['labour-court-gent'])
    })

    it('answers per municipality for a shared code, so neither is silently dropped', () => {
        const result = findCourtsForPostalCode('1804', 'police-court')
        expect(result.map((r) => r.municipality.name.nl)).toEqual(['Vilvoorde', 'Zemst'])
        for (const entry of result) {
            expect(entry.justicesOfThePeace.length).toBeGreaterThan(0)
            expect(entry.courts.length).toBeGreaterThan(0)
        }
        expect(
            findCourtsForPostalCode('1040', 'justice-of-the-peace').map((r) => r.courts.length),
        ).toEqual([findJusticesOfThePeace('21004').length, 1])
    })

    it('returns an empty list for an unknown code, and answers for a day', () => {
        expect(findCourtsForPostalCode('0000', 'police-court')).toEqual([])
        expect(findCourtsForPostalCode('9000', 'police-court', { on: '2025-06-01' })).toHaveLength(
            1,
        )
        expect(() => findCourtsForPostalCode('9000', 'police-court', { on: '2024-12-31' })).toThrow(
            RangeError,
        )
    })
})

describe('address links (#28)', () => {
    const records: { id: string; validTo?: string; address?: Address }[] = [
        ...courts,
        ...prisons,
        ...housesOfJustice,
    ]

    it('link an address to a municipality its postal code belongs to, through the postal code', () => {
        for (const { id, address } of records) {
            if (!address?.municipality) continue
            expect(
                getMunicipalitiesForPostalCode(address.postalCode).map((m) => m.id),
                id,
            ).toContain(address.municipality)
        }
    })

    it('link every current address whose postal code belongs to one municipality', () => {
        for (const { id, address, validTo } of records) {
            if (!address || validTo !== undefined) continue
            const candidates = getMunicipalitiesForPostalCode(address.postalCode)
            if (candidates.length === 1) expect(address.municipality, id).toBe(candidates[0]?.id)
        }
    })

    // The one court that publishes a seat outside its arrondissement
    const seatedElsewhere: Record<string, string> = {
        'justice-of-the-peace-limbourg': "a temporary seat in Eupen's courthouse, as its page says",
    }

    it("put every court in its arrondissement, or its judicial area's", () => {
        for (const court of courts) {
            const municipality = court.address?.municipality
            if (!municipality || court.id in seatedElsewhere) continue
            const arrondissement = getArrondissementForMunicipality(municipality, {
                on: court.validFrom ?? today,
            })
            expect(arrondissement, court.id).toBeDefined()
            if (court.arrondissement)
                expect(arrondissement?.id, court.id).toBe(court.arrondissement)
            else expect(arrondissement?.judicialArea, court.id).toBe(court.judicialArea)
        }
        expect(getArrondissement('brussel').judicialArea).toBe('brussel')
        expect(getArrondissementForMunicipality('63023')?.id).toBe('eupen')
    })
})
