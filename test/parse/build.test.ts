// The parsers end to end, on trimmed copies of real pages in test/fixtures/sources
import { describe, expect, it } from 'vitest'

import { buildCourts, parseTitle, placeAndNumber } from '../../scripts/parse/courts.ts'
import { buildHousesOfJustice, buildPrisons } from '../../scripts/parse/places.ts'

const root = 'test/fixtures/sources'

describe('buildCourts', () => {
    const { courts, report } = buildCourts(root)
    const court = (id: string) => courts.find((c) => c.id === id)

    it('reads a justice of the peace and links it to its canton', () => {
        expect(court('justice-of-the-peace-gent-1')).toMatchObject({
            type: 'justice-of-the-peace',
            kind: 'court',
            name: { nl: 'Vredegerecht Gent 1' },
            judicialArea: 'gent',
            arrondissement: 'oost-vlaanderen',
            canton: 'gent-1',
        })
        // Its hours come with a summer arrangement: only the published text
        expect(court('justice-of-the-peace-gent-1')?.openingHours).toBeUndefined()
        expect(court('justice-of-the-peace-gent-1')?.openingHoursText?.nl).toMatch(/^De griffie/)
    })

    it('reads opening hours when every language says the same', () => {
        expect(court('justice-of-the-peace-tongeren-borgloon')?.openingHours).toBe(
            'Mo-Fr 08:30-12:30,13:30-16:00',
        )
    })

    it("merges a bilingual court's pages, keeping the first language's contacts", () => {
        const meise = court('justice-of-the-peace-meise')
        expect(meise?.name).toEqual({ nl: 'Vredegerecht Meise', fr: 'Justice de paix de Meise' })
        expect(Object.keys(meise?.website ?? {})).toEqual(['nl', 'fr'])
        expect(meise?.sources).toHaveLength(4)
        // The Dutch text has a temporary closure the French one doesn't: no machine-readable hours
        expect(meise?.openingHours).toBeUndefined()
        expect(Object.keys(meise?.openingHoursText ?? {})).toEqual(['nl', 'fr'])
    })

    it('reads a division, its court, and the arrondissement of its municipality', () => {
        expect(court('enterprise-court-gent')).toMatchObject({
            kind: 'court',
            judicialArea: 'gent',
        })
        expect(court('enterprise-court-gent')?.arrondissement).toBeUndefined()
        expect(court('enterprise-court-gent-brugge')).toMatchObject({
            kind: 'division',
            court: 'enterprise-court-gent',
            arrondissement: 'west-vlaanderen',
            name: { nl: 'Ondernemingsrechtbank Gent - afdeling Brugge' },
        })
    })

    it('keeps a court and its divisions apart', () => {
        const gent = court('enterprise-court-gent')
        const brugge = court('enterprise-court-gent-brugge')
        expect(gent?.website).toEqual({
            nl: 'https://www.tribunaux-rechtbanken.be/nl/ondernemingsrechtbank-gent',
        })
        expect(brugge?.website.nl).toMatch(/afdeling-brugge$/)
        expect(gent?.sources.some((s) => s.url.includes('afdeling'))).toBe(false)
        expect(gent?.contacts).not.toBe(brugge?.contacts)
    })

    it('cites the pages that named a court known only from its seats', () => {
        expect(court('justice-of-the-peace-philippeville')).toMatchObject({
            name: { fr: 'Justice de paix de Philippeville' },
            website: {},
            contacts: [],
            sources: [
                {
                    url: 'https://www.tribunaux-rechtbanken.be/fr/justice-de-paix-de-philippeville-siege-couvin',
                },
            ],
        })
    })

    it('labels contacts with their registry', () => {
        const liege = court('court-of-appeal-liege')
        expect(liege?.ecli).toEqual(['CALIE'])
        expect(liege?.contacts).toContainEqual({
            type: 'email',
            value: 'liege.ca.greffepenal@just.fgov.be',
            label: 'Greffe pénal',
        })
    })

    it('uses the German place name for ids in the German-speaking area', () => {
        expect(court('police-court-eupen-sankt-vith')?.name).toEqual({
            de: 'Polizeigericht Eupen, Abteilung Sankt Vith',
            fr: "Tribunal de police d'Eupen - division Saint-Vith",
        })
    })

    it('reads the seats of a justice of the peace', () => {
        expect(court('justice-of-the-peace-philippeville-couvin')).toMatchObject({
            kind: 'seat',
            court: 'justice-of-the-peace-philippeville',
            canton: 'philippeville',
        })
    })

    it('places the French page with an outdated name under its canton', () => {
        expect(court('justice-of-the-peace-tongeren-borgloon')?.name).toEqual({
            nl: 'Vredegerecht Tongeren-Borgloon',
            fr: 'Justice de paix de Tongres-Fourons',
        })
    })

    it('skips the shared pages of all justices of the peace of an arrondissement', () => {
        expect(courts.some((c) => c.id.includes('vredegerechten'))).toBe(false)
        expect(report.unmatched).toEqual([])
        expect(report.conflicts).toEqual([])
    })

    it('reports courts in the ECLI table that the sources lack', () => {
        expect(report.eclisWithoutCourt).toContain('court-of-appeal-mons')
        expect(report.eclisWithoutCourt).not.toContain('court-of-appeal-liege')
    })

    it('gives a court the cantons the law assigns it, and the arrondissement they share', () => {
        const gent = court('enterprise-court-gent')
        expect(gent?.cantons).toContain('gent-1')
        expect(gent?.cantons).toContain('brugge-1')
        expect(gent?.arrondissement).toBeUndefined()
        expect(court('police-court-eupen')).toMatchObject({
            cantons: ['eupen-sankt-vith-1', 'eupen-sankt-vith-2'],
            arrondissement: 'eupen',
        })
        // A division: the cantons its decree gives it, and the decrees among its sources
        expect(court('enterprise-court-gent-brugge')?.cantons).toEqual([
            'brugge-1',
            'brugge-2',
            'brugge-3',
            'brugge-4',
            'tielt',
        ])
        expect(court('enterprise-court-gent-brugge')?.sources.map((s) => s.url)).toContain(
            'https://www.ejustice.just.fgov.be/eli/besluit/2014/03/14/2014009088/staatsblad',
        )
        expect(court('justice-of-the-peace-gent-1')?.cantons).toBeUndefined()
    })

    it('reports courts and divisions in the division areas that the sources lack', () => {
        // The fixtures hold the enterprise court of Gent and some of its divisions only
        expect(report.divisionAreasWithoutCourt).toContain('labour-court-gent')
        expect(report.divisionAreasWithoutCourt).not.toContain('enterprise-court-gent')
        expect(report.divisionAreasWithoutCourt).not.toContain('enterprise-court-gent-brugge')
    })

    it('reports courts in the law table that the sources lack', () => {
        expect(report.jurisdictionsWithoutCourt).toContain('court-of-appeal-mons')
        expect(report.jurisdictionsWithoutCourt).not.toContain('court-of-appeal-liege')
        expect(report.courtsWithoutJurisdiction).toEqual([])
    })

    it('reports every canton without a court', () => {
        expect(report.cantonsWithoutCourt).toContain('antwerpen-1')
        expect(report.cantonsWithoutCourt).not.toContain('gent-1')
    })
})

describe('parseTitle', () => {
    it.each([
        ['Vredegerecht Gent 1', { type: 'justice-of-the-peace', place: 'Gent 1' }],
        [
            'Nederlandstalige politierechtbank Brussel',
            { type: 'police-court', place: 'Brussel', split: 'nl' },
        ],
        [
            'Tribunal de police francophone de Bruxelles',
            { type: 'police-court', place: 'Bruxelles', split: 'fr' },
        ],
        [
            'Tribunal du travail du Hainaut - division La Louvière',
            { type: 'labour-court', place: 'Hainaut', division: 'La Louvière' },
        ],
        [
            "Cour d'assises de l'arrondissement administratif de Bruxelles-Capitale",
            { type: 'court-of-assize', place: 'Bruxelles-Capitale' },
        ],
        ['Justice de paix de La Louvière', { type: 'justice-of-the-peace', place: 'La Louvière' }],
        ['Vredegerecht Deinze', { type: 'justice-of-the-peace', place: 'Deinze' }],
    ])('%s', (title, expected) => {
        expect(parseTitle(title)).toEqual(expected)
    })

    it('skips the pages of all justices of the peace of an arrondissement', () => {
        expect(parseTitle('Vredegerechten Antwerpen')).toBeUndefined()
        expect(parseTitle('Justices de paix du Hainaut')).toBeUndefined()
    })

    it('refuses an unknown kind of court', () => {
        expect(() => parseTitle('Raad van State')).toThrow('Unknown kind of court')
    })
})

describe('placeAndNumber', () => {
    it.each([
        ['Gent 1', ['Gent', 1]],
        ['Brugge IV', ['Brugge', 4]],
        ['Anderlecht 1e kanton', ['Anderlecht', 1]],
        ["d'Anderlecht 2ième canton", ["d'Anderlecht", 2]],
        ['eerste kanton Mol-Geel', ['Mol-Geel', 1]],
        ["premier canton d'Eupen-Saint Vith", ['Eupen-Saint Vith', 1]],
        ['ersten Kantons Eupen-Sankt Vith', ['Eupen-Sankt Vith', 1]],
        ['Deinze', ['Deinze', undefined]],
    ])('%s', (text, expected) => {
        expect(placeAndNumber(text)).toEqual(expected)
    })
})

describe('buildPrisons', () => {
    it('reads a prison in the three languages', () => {
        const { prisons, problems } = buildPrisons(root)
        expect(problems).toEqual([])
        expect(prisons).toEqual([
            expect.objectContaining({
                id: 'gevangenis-gent',
                kind: 'prison',
                name: { nl: 'Gevangenis van Gent', fr: 'Prison de Gand', de: 'Gefängnis Gent' },
                address: { street: 'Nieuwe Wandeling 89', postalCode: '9000', city: 'Gent' },
            }),
        ])
        expect(prisons[0]?.contacts.map((c) => c.type)).toEqual(['phone', 'fax', 'bank-account'])
    })
})

describe('buildHousesOfJustice', () => {
    const { houses, problems } = buildHousesOfJustice(root)

    it('reads the Flemish houses with their OVO number', () => {
        expect(problems).toEqual([])
        expect(houses.find((h) => h.id === 'justitiehuis-gent')).toMatchObject({
            community: 'flemish',
            ovo: 'OVO001917',
            address: { street: 'Cataloniëstraat 6', postalCode: '9000', city: 'Gent' },
            contacts: [
                { type: 'phone', value: '+3292696220' },
                { type: 'email', value: 'justitiehuis.gent@vlaanderen.be' },
            ],
        })
    })

    it('reads a French-speaking house and its victims service', () => {
        const namur = houses.find((h) => h.id === 'maison-justice-namur')
        expect(namur?.address).toEqual({
            street: '6 boulevard Ernest Mélot',
            postalCode: '5000',
            city: 'Namur',
        })
        expect(namur?.contacts).toContainEqual({
            type: 'email',
            value: 'accueildesvictimes.namur@cfwb.be',
            label: "service d'accueil des victimes",
        })
    })
})
