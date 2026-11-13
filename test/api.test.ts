import { describe, expect, expectTypeOf, it } from 'vitest'

import {
    type ArrondissementId,
    type Canton,
    type CantonId,
    type Court,
    type Municipality,
    type MunicipalityId,
    type Prison,
    cantons,
    findCourtsWithJurisdiction,
    findDivisionsWithJurisdiction,
    findCourts,
    findJusticesOfThePeace,
    getCanton,
    getCourt,
    getCourtsForCanton,
    getDivisions,
    getHouseOfJustice,
    getMunicipality,
    getCantonsForMunicipality,
    getInterestRate,
    getJusticeOfThePeace,
    getPrison,
} from '../src'

describe('getInterestRate input validation', () => {
    // Periods are compared as strings: a day that isn't zero-padded used to fall in the
    // wrong period silently ('2013-1-15' gave the second semester's rate).
    it.each(['2013-1-15', '15/01/2013', '2013-02-30', '2013-13-01', '', 'today'])(
        'rejects %j',
        (day) => {
            expect(() => getInterestRate(day, 'commercial')).toThrow(RangeError)
        },
    )

    it('rejects an invalid Date', () => {
        expect(() => getInterestRate(new Date('nope'), 'legal')).toThrow(RangeError)
    })

    it('accepts an ISO timestamp and uses its day', () => {
        expect(getInterestRate('2013-01-15T23:00:00Z', 'commercial')?.rate).toBe(8)
    })

    it('accepts leap days', () => {
        expect(getInterestRate('2024-02-29', 'legal')?.rate).toBe(5.75)
    })

    it('includes both ends of a period', () => {
        expect(getInterestRate('2013-06-30', 'commercial')?.period.to).toBe('2013-06-30')
        expect(getInterestRate('2013-07-01', 'commercial')?.period.from).toBe('2013-07-01')
    })
})

describe('getJusticeOfThePeace', () => {
    it('finds the court of a canton', () => {
        expect(getJusticeOfThePeace('gent-1').id).toBe('justice-of-the-peace-gent-1')
    })

    it('returns undefined for an unknown canton', () => {
        expect(getJusticeOfThePeace('NoSuchCanton')).toBeUndefined()
    })
})

describe('findCourtsWithJurisdiction', () => {
    it('finds the police court of Halle-Vilvoorde, not Brussels', () => {
        // Vilvoorde
        expect(findCourtsWithJurisdiction('23088', 'police-court').map((c) => c.id)).toEqual([
            'police-court-vilvoorde',
        ])
    })

    it('finds both language courts in Brussels', () => {
        // Brussel
        expect(
            findCourtsWithJurisdiction('21004', 'court-of-first-instance').map((c) => c.id),
        ).toEqual(['court-of-first-instance-brussel-fr', 'court-of-first-instance-brussel-nl'])
    })

    it('finds one court for a city split over cantons, and every justice of the peace', () => {
        // Gent
        expect(findCourtsWithJurisdiction('44021', 'labour-court').map((c) => c.id)).toEqual([
            'labour-court-gent',
        ])
        expect(
            findCourtsWithJurisdiction('44021', 'justice-of-the-peace').map((c) => c.canton),
        ).toEqual(findJusticesOfThePeace('44021').map((c) => c.canton.id))
    })

    it('finds the court of assize of the province', () => {
        // Vilvoorde lies in the judicial arrondissement of Brussels, but the province of Vlaams-Brabant
        expect(findCourtsWithJurisdiction('23088', 'court-of-assize').map((c) => c.id)).toEqual([
            'court-of-assize-vlaams-brabant',
        ])
        // Eupen: the court of assize of Liège
        expect(findCourtsWithJurisdiction('63023', 'court-of-assize').map((c) => c.id)).toEqual([
            'court-of-assize-liege',
        ])
    })

    it('answers for a day, within the coverage', () => {
        expect(
            findCourtsWithJurisdiction('23088', 'police-court', { on: '2025-06-01' }),
        ).toHaveLength(1)
        expect(() =>
            findCourtsWithJurisdiction('23088', 'police-court', { on: '2024-12-31' }),
        ).toThrow(RangeError)
    })

    it('returns an empty list for an unknown code', () => {
        expect(findCourtsWithJurisdiction('99999', 'police-court')).toEqual([])
    })
})

describe('findDivisionsWithJurisdiction', () => {
    const ids = (municipality: string, type: Parameters<typeof findDivisionsWithJurisdiction>[1]) =>
        findDivisionsWithJurisdiction(municipality, type).map((c) => c.id)

    it('finds the division by canton', () => {
        expect(ids('31005', 'enterprise-court')).toEqual(['enterprise-court-gent-brugge'])
        // Gent is split over five cantons, all in the same division
        expect(ids('44021', 'labour-court')).toEqual(['labour-court-gent-gent'])
        // The labour court of appeal of Liège: the province of Liège holds Eupen too
        expect(ids('63023', 'labour-court-of-appeal')).toEqual([
            'labour-court-of-appeal-liege-liege',
        ])
    })

    it('finds a division that takes only part of a canton', () => {
        // KB 14 March 2014, art. 16: Pont-à-Celles (canton Seneffe) goes to Charleroi, and
        // Erquelinnes (canton Chimay) to Binche
        expect(ids('52055', 'labour-court')).toEqual(['labour-court-hainaut-charleroi'])
        expect(ids('56022', 'labour-court')).toEqual(['labour-court-hainaut-binche'])
        expect(ids('56049', 'labour-court')).toEqual(['labour-court-hainaut-binche'])
        // Seneffe stays with its canton, which goes to Binche
        expect(ids('55085', 'labour-court')).toEqual(['labour-court-hainaut-binche'])
        // The enterprise court keeps the whole canton Chimay together
        expect(ids('56022', 'enterprise-court')).toEqual(['enterprise-court-hainaut-charleroi'])
        // Since 2024 Hannut (canton Waremme) goes to Huy, Waremme itself to Liège
        expect(ids('64034', 'court-of-first-instance')).toEqual([
            'court-of-first-instance-liege-huy',
        ])
        expect(ids('64074', 'court-of-first-instance')).toEqual([
            'court-of-first-instance-liege-liege',
        ])
    })

    it('gives the court itself where the data has no divisions', () => {
        expect(ids('24062', 'court-of-first-instance')).toEqual(['court-of-first-instance-leuven'])
        // The police courts' division areas aren't in the data yet
        expect(ids('44021', 'police-court')).toEqual(['police-court-oost-vlaanderen'])
    })

    it('is empty for an unknown municipality', () => {
        expect(findDivisionsWithJurisdiction('99999', 'labour-court')).toEqual([])
    })
})

describe('lookups on a day', () => {
    it('find the version of a court, prison or house that applies on that day', () => {
        expect(getCourt('justice-of-the-peace-gent-1', { on: '2025-06-01' })?.id).toBe(
            'justice-of-the-peace-gent-1',
        )
        expect(getPrison('gevangenis-gent', { on: '2026-10-20' })?.id).toBe('gevangenis-gent')
        expect(getHouseOfJustice('justitiehuis-gent', { on: new Date() })?.id).toBe(
            'justitiehuis-gent',
        )
        expect(getJusticeOfThePeace('gent-1', { on: '2025-06-01' })?.id).toBe(
            'justice-of-the-peace-gent-1',
        )
    })

    it('filter lists to that day', () => {
        expect(getDivisions('enterprise-court-gent', { on: '2025-06-01' })).toHaveLength(8)
        expect(getCourtsForCanton('gent-1', { on: '2025-06-01' })).toHaveLength(8)
        expect(findCourts({ type: 'court-of-appeal' }, { on: '2025-06-01' })).toHaveLength(5)
    })

    it("throw for a day before the dataset's coverage", () => {
        expect(() => getCourt('justice-of-the-peace-gent-1', { on: '2024-12-31' })).toThrow(
            RangeError,
        )
        expect(() => getPrison('gevangenis-gent', { on: '2026-10-19' })).toThrow(
            'The prisons data describes 2026-10-20 onwards',
        )
        expect(() => getHouseOfJustice('justitiehuis-gent', { on: '2026-10-19' })).toThrow(
            RangeError,
        )
        expect(() => findCourts({}, { on: '2024-12-31' })).toThrow(RangeError)
    })
})

describe('lookups', () => {
    it('return copies, so callers cannot change the shared data', () => {
        getCantonsForMunicipality('44021').pop()
        expect(getCantonsForMunicipality('44021')).toHaveLength(5)
    })

    it('find every canton through each of its municipalities', () => {
        for (const canton of cantons) {
            for (const { municipality } of canton.municipalities) {
                expect(getCantonsForMunicipality(municipality), canton.id).toContain(canton)
            }
        }
    })
})

describe('id types', () => {
    it('return a record, not undefined, for a known id', () => {
        expectTypeOf(getCanton('gent-1')).toEqualTypeOf<Canton>()
        expectTypeOf(getCourt('justice-of-the-peace-gent-1')).toEqualTypeOf<Court>()
        expectTypeOf(getMunicipality('44021')).toEqualTypeOf<Municipality>()
        expectTypeOf(getJusticeOfThePeace('gent-1')).toEqualTypeOf<Court>()
    })

    it('may return undefined on a given day, even for a known id', () => {
        expectTypeOf(getCanton('gent-1', { on: '2025-06-01' })).toEqualTypeOf<Canton | undefined>()
        expectTypeOf(getCourt('court-of-appeal-gent', { on: '2025-06-01' })).toEqualTypeOf<
            Court | undefined
        >()
        expectTypeOf(getPrison('gevangenis-gent', { on: '2026-10-20' })).toEqualTypeOf<
            Prison | undefined
        >()
    })

    it('may return undefined for any other string', () => {
        const lookup = (id: string) => getCanton(id)
        expectTypeOf(lookup).returns.toEqualTypeOf<Canton | undefined>()
        expectTypeOf(getCanton('no-such-canton')).toEqualTypeOf<Canton | undefined>()
    })

    it('type the links between datasets', () => {
        expectTypeOf<Canton['arrondissement']>().toEqualTypeOf<ArrondissementId>()
        expectTypeOf<
            Canton['municipalities'][number]['municipality']
        >().toEqualTypeOf<MunicipalityId>()
        // @ts-expect-error: not a canton id
        const typo: CantonId = 'gent1'
        expect(typo).toBe('gent1')
    })
})
