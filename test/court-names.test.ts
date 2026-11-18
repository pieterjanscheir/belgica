import { describe, expect, it } from 'vitest'

import {
    appliesOn,
    courts,
    formatCourtName,
    getCanton,
    getCourt,
    type Court,
    type CantonId,
    type CourtId,
    type Locale,
} from '../src'
import { today as todayInBelgium } from '../src/time'

const locales: Locale[] = ['nl', 'fr', 'de']
const today = todayInBelgium()
const justicesOfThePeace = courts.filter(
    (c) => c.type === 'justice-of-the-peace' && c.kind === 'court' && appliesOn(c, today),
)

describe('formatCourtName', () => {
    it('builds the canton label in each language', () => {
        const gent1 = getCourt('justice-of-the-peace-gent-1')
        expect(formatCourtName(gent1, 'nl', { style: 'canton' })).toBe(
            'Vredegerecht 1e kanton Gent',
        )
        expect(formatCourtName(gent1, 'fr', { style: 'canton' })).toBe(
            'Justice de paix 1er canton Gand',
        )
        expect(formatCourtName(gent1, 'de', { style: 'canton' })).toBe(
            'Friedensgericht 1. Kanton Gent',
        )
        const gent2 = getCourt('justice-of-the-peace-gent-2')
        expect(formatCourtName(gent2, 'fr', { style: 'canton' })).toBe(
            'Justice de paix 2e canton Gand',
        )
        const deinze = getCourt('justice-of-the-peace-deinze')
        expect(locales.map((l) => formatCourtName(deinze, l, { style: 'canton' }))).toEqual([
            'Vredegerecht kanton Deinze',
            'Justice de paix canton Deinze',
            'Friedensgericht Kanton Deinze',
        ])
    })

    it('uses the German canton name where an official text gives one', () => {
        expect(
            formatCourtName(getCourt('justice-of-the-peace-eupen-sankt-vith-1'), 'de', {
                style: 'canton',
            }),
        ).toBe('Friedensgericht 1. Kanton Eupen-Sankt Vith')
        expect(
            formatCourtName(getCourt('justice-of-the-peace-eupen-sankt-vith-2'), 'fr', {
                style: 'canton',
            }),
        ).toBe('Justice de paix 2e canton Eupen-Saint-Vith')
    })

    it("uses the court's own language for the German canton name otherwise", () => {
        // Most cantons have no German name: Dutch for a Flemish court, French for the others
        expect(
            formatCourtName(getCourt('justice-of-the-peace-gent-1'), 'de', { style: 'canton' }),
        ).toBe('Friedensgericht 1. Kanton Gent')
        expect(
            formatCourtName(getCourt('justice-of-the-peace-brussel-1'), 'de', { style: 'canton' }),
        ).toBe('Friedensgericht 1. Kanton Bruxelles')
        expect(
            formatCourtName(getCourt('justice-of-the-peace-namur-1'), 'de', { style: 'canton' }),
        ).toBe('Friedensgericht 1. Kanton Namur')
        // In Dutch and French the canton has a name of its own: Namen, not Namur
        expect(
            formatCourtName(getCourt('justice-of-the-peace-namur-1'), 'nl', { style: 'canton' }),
        ).toBe('Vredegerecht 1e kanton Namen')
    })

    it('gives the official name by default, falling back when the court has none in a language', () => {
        const gent1 = getCourt('justice-of-the-peace-gent-1')
        expect(formatCourtName(gent1, 'nl')).toBe('Vredegerecht Gent 1')
        expect(formatCourtName(gent1, 'fr', { style: 'official' })).toBe('Vredegerecht Gent 1')
        expect(formatCourtName(gent1, 'de')).toBe('Vredegerecht Gent 1')
        const brussel1 = getCourt('justice-of-the-peace-brussel-1')
        expect(formatCourtName(brussel1, 'fr')).toBe('Justice de paix de Bruxelles 1er canton')
        expect(formatCourtName(brussel1, 'de')).toBe('Justice de paix de Bruxelles 1er canton')
        const namur1 = getCourt('justice-of-the-peace-namur-1')
        expect(formatCourtName(namur1, 'nl')).toBe('Justice de paix de Namur I')
        const eupen = getCourt('justice-of-the-peace-eupen-sankt-vith-1')
        expect(formatCourtName(eupen, 'de')).toBe(
            'Friedensgericht des ersten Kantons Eupen-Sankt Vith',
        )
        expect(formatCourtName(eupen, 'nl')).toBe(
            "Justice de paix du premier canton d'Eupen-Saint Vith",
        )
    })

    it('gives the official name for other courts and for seats', () => {
        const ids: CourtId[] = [
            'enterprise-court-gent-brugge',
            'justice-of-the-peace-philippeville-couvin',
        ]
        for (const id of ids) {
            const court = getCourt(id)
            for (const locale of locales) {
                expect(formatCourtName(court, locale, { style: 'canton' })).toBe(
                    formatCourtName(court, locale),
                )
            }
        }
    })

    // A record without a stored label, such as one saved before 0.5.0: the label is built from
    // the canton
    it('gives the official name for a justice of the peace whose canton is unknown', () => {
        const court: Court = { ...getCourt('justice-of-the-peace-gent-1') }
        delete court.canton
        delete court.label
        expect(formatCourtName(court, 'fr', { style: 'canton' })).toBe('Vredegerecht Gent 1')
        const elsewhere: Court = { ...court, canton: 'no-such-canton' as CantonId }
        expect(formatCourtName(elsewhere, 'fr', { style: 'canton' })).toBe('Vredegerecht Gent 1')
    })

    it('labels a court that has ended with its canton as it was then', () => {
        const court: Court = { ...getCourt('justice-of-the-peace-gent-1'), validTo: '2025-06-30' }
        delete court.label
        expect(formatCourtName(court, 'nl', { style: 'canton' })).toBe(
            'Vredegerecht 1e kanton Gent',
        )
    })

    it('throws for a court without a name', () => {
        const court: Court = { ...getCourt('justice-of-the-peace-gent-1'), name: {} }
        expect(() => formatCourtName(court, 'nl')).toThrow(
            "Court 'justice-of-the-peace-gent-1' has no name",
        )
    })

    it('names every justice of the peace in every language, in both styles', () => {
        expect(justicesOfThePeace).toHaveLength(162)
        for (const court of justicesOfThePeace) {
            const canton = getCanton(court.canton ?? '')
            if (!canton) throw new Error(`${court.id} has no canton`)
            for (const locale of locales) {
                expect(formatCourtName(court, locale).trim()).not.toBe('')
                const label = formatCourtName(court, locale, { style: 'canton' })
                expect(label).not.toMatch(/undefined|\s{2}|^\s|\s$/)
                const name = canton.name[locale]
                if (name !== undefined) expect(label.endsWith(` ${name}`)).toBe(true)
                // The number in the label is the canton's
                const number = /(\d+)(?:e|er|\.) [kK]anton|(\d+)(?:e|er) canton/.exec(label)
                const found = number && Number(number[1] ?? number[2])
                expect(found ?? undefined).toBe(canton.number)
            }
        }
    })
})
