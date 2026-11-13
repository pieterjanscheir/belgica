import { describe, expect, it } from 'vitest'

import { germanCantonNames } from '../scripts/german-canton-names.ts'
import { isPersonalEmail, withoutPersonName } from '../scripts/parse/people.ts'

import {
    appliesOn,
    arrondissements,
    cantons,
    courts,
    findCourts,
    getContact,
    getCourt,
    getCourtsForCanton,
    getDivisions,
    judicialAreas,
    getInterestRate,
    getLatestKnownRateDate,
    housesOfJustice,
    interestRates,
    prisons,
    toDay,
    type InterestType,
} from '../src'

/** Each item paired with the one after it */
const consecutive = <T>(items: readonly T[]): [T, T][] =>
    items.flatMap((item, i) => {
        const next = items[i + 1]
        return next === undefined ? [] : [[item, next] as [T, T]]
    })

// The records that apply today; the files hold every version (validFrom, validTo)
const today = toDay(new Date())
const current = courts.filter((c) => appliesOn(c, today))

describe('data integrity', () => {
    it('has one version of each court per day: unique (id, validFrom), and no overlaps', () => {
        const keys = courts.map((c) => `${c.id}|${c.validFrom ?? ''}`)
        expect(new Set(keys).size).toBe(keys.length)
        const ids = current.map((c) => c.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('only references known areas, arrondissements, cantons and courts', () => {
        const areas = new Set(judicialAreas.map((a) => a.id))
        const known = new Set(arrondissements.map((a) => a.id))
        const cantonIds = new Set(cantons.map((c) => c.id))
        for (const c of courts) {
            expect(areas, c.id).toContain(c.judicialArea)
            if (c.arrondissement) expect(known, c.id).toContain(c.arrondissement)
            if (c.canton) expect(cantonIds, c.id).toContain(c.canton)
            if (c.court) expect(getCourt(c.court).kind, c.id).toBe('court')
        }
    })

    it('puts every arrondissement in its judicial area', () => {
        for (const c of courts) {
            if (c.arrondissement)
                expect(
                    arrondissements.find((a) => a.id === c.arrondissement)?.judicialArea,
                    c.id,
                ).toBe(c.judicialArea)
        }
    })

    it('gives a division the type and area of its court', () => {
        for (const c of courts) {
            if (c.kind === 'court') {
                expect(c.court, c.id).toBeUndefined()
                continue
            }
            const court = getCourt(c.court ?? '')
            expect(court?.type, c.id).toBe(c.type)
            expect(court?.judicialArea, c.id).toBe(c.judicialArea)
            expect(c.id.startsWith(`${court?.id ?? ''}-`), c.id).toBe(true)
        }
    })

    it('gives every division of the divided courts its area, once', () => {
        // A municipality belongs to the division that names it in `municipalities`, or else to
        // the one that has its canton in `cantons`: each (canton, municipality) pair of a
        // court's area must land in exactly one of its divisions
        const divided = new Set([
            'court-of-first-instance',
            'enterprise-court',
            'labour-court',
            'labour-court-of-appeal',
        ])
        let checked = 0
        for (const court of courts) {
            if (court.kind !== 'court' || !divided.has(court.type)) continue
            const divisions = getDivisions(court.id).filter((d) => d.kind === 'division')
            if (divisions.length === 0) continue
            checked++
            for (const d of divisions)
                expect(d.cantons ?? d.municipalities, `${d.id} has no area`).toBeDefined()
            for (const id of court.cantons ?? []) {
                const canton = cantons.find((c) => c.id === id)
                expect(canton, id).toBeDefined()
                for (const { municipality } of canton?.municipalities ?? []) {
                    const named = divisions.filter((d) =>
                        (d.municipalities as readonly string[] | undefined)?.includes(municipality),
                    )
                    const holders =
                        named.length > 0 ? named : divisions.filter((d) => d.cantons?.includes(id))
                    expect(
                        holders.map((d) => d.id),
                        `${court.id}: ${id} / ${municipality}`,
                    ).toHaveLength(1)
                }
            }
            // Nothing outside the court's area
            const area = new Set(
                (court.cantons ?? []).flatMap(
                    (id) =>
                        cantons
                            .find((c) => c.id === id)
                            ?.municipalities.map((m) => m.municipality) ?? [],
                ),
            )
            for (const d of divisions) {
                for (const id of d.cantons ?? [])
                    expect(court.cantons, `${d.id}: ${id}`).toContain(id)
                for (const m of d.municipalities ?? [])
                    expect(area.has(m), `${d.id}: ${m}`).toBe(true)
            }
        }
        // 3 labour courts of appeal, 8 courts of first instance, 4 enterprise and 4 labour courts
        expect(checked).toBe(19)
    })

    it('gives no area to a seat, or to a division of a police court', () => {
        for (const c of courts) {
            if (c.kind === 'seat' || (c.kind === 'division' && c.type === 'police-court')) {
                expect(c.cantons, c.id).toBeUndefined()
                expect(c.municipalities, c.id).toBeUndefined()
            }
        }
    })

    it('names every court in at least one language', () => {
        for (const c of courts) expect(Object.values(c.name).length, c.id).toBeGreaterThan(0)
    })

    it('has a justice of the peace for every canton, serving only that canton', () => {
        const served = current
            .filter((c) => c.type === 'justice-of-the-peace' && c.kind === 'court')
            .map((c) => c.canton)
        expect([...served].sort()).toEqual(cantons.map((c) => c.id).sort())
        for (const c of courts.filter((c) => c.type === 'justice-of-the-peace')) {
            const canton = cantons.find((k) => k.id === c.canton)
            expect(canton?.arrondissement, c.id).toBe(c.arrondissement)
        }
    })

    it('gives every court other than a justice of the peace the cantons it covers', () => {
        const cantonIds = new Set(cantons.map((c) => c.id))
        for (const c of courts) {
            if (c.kind === 'court' && c.type !== 'justice-of-the-peace') {
                expect(c.cantons?.length, c.id).toBeGreaterThan(0)
                for (const id of c.cantons ?? []) expect(cantonIds, `${c.id}: ${id}`).toContain(id)
            } else if (c.kind === 'division') {
                // A division's area: see 'gives every division of the divided courts its area'
                if (c.cantons) expect(c.cantons.length, c.id).toBeGreaterThan(0)
                for (const id of c.cantons ?? []) expect(cantonIds, `${c.id}: ${id}`).toContain(id)
            } else expect(c.cantons, c.id).toBeUndefined()
        }
    })

    it("keeps a court's cantons within its arrondissement and judicial area", () => {
        const arrondissementOf = new Map<string, string>(
            cantons.map((c) => [c.id, c.arrondissement]),
        )
        const areaOf = new Map<string, string>(arrondissements.map((a) => [a.id, a.judicialArea]))
        for (const c of courts) {
            const held = new Set((c.cantons ?? []).map((id) => arrondissementOf.get(id)))
            if (c.cantons)
                expect(c.arrondissement, c.id).toBe(held.size === 1 ? [...held][0] : undefined)
            for (const arrondissement of held)
                expect(areaOf.get(arrondissement ?? ''), `${c.id}: ${arrondissement ?? ''}`).toBe(
                    c.judicialArea,
                )
        }
    })

    // Art. 3–5 of the annex: every canton falls under one court of each type, or a Dutch- and
    // a French-speaking one in Brussels
    it.each([
        'police-court',
        'court-of-first-instance',
        'enterprise-court',
        'labour-court',
        'court-of-appeal',
        'labour-court-of-appeal',
        'court-of-assize',
    ])('puts every canton under one %s, or one per language in Brussels', (type) => {
        for (const canton of cantons) {
            const covering = current.filter(
                (c) => c.kind === 'court' && c.type === type && c.cantons?.includes(canton.id),
            )
            const languages = covering.map((c) => /-(nl|fr)$/.exec(c.id)?.[1] ?? '-').sort()
            expect(
                [['-'], ['fr', 'nl']],
                `${canton.id}: ${covering.map((c) => c.id).join(', ')}`,
            ).toContainEqual(languages)
        }
    })

    it('has every kind of court', () => {
        const count = (type: string) =>
            current.filter((c) => c.type === type && c.kind === 'court').length
        expect(count('court-of-appeal')).toBe(5)
        expect(count('labour-court-of-appeal')).toBe(5)
        // 12 arrondissements, with Brussels split by language
        expect(count('court-of-first-instance')).toBe(13)
        expect(count('enterprise-court')).toBe(9)
        expect(count('labour-court')).toBe(9)
        // Brussels split by language, and Halle and Vilvoorde in the Brussels arrondissement
        expect(count('police-court')).toBe(15)
        // One per province, and Brussels-Capital
        expect(count('court-of-assize')).toBe(11)
    })

    it("gives every record its own pages: a court never has a division's page", () => {
        const owner = new Map<string, string>()
        for (const c of courts) {
            for (const url of Object.values(c.website)) {
                expect(
                    owner.get(url),
                    `${c.id} and ${owner.get(url) ?? ''} share ${url}`,
                ).toBeUndefined()
                owner.set(url, c.id)
            }
        }
    })

    it('has a source for every record', () => {
        for (const c of courts) {
            expect(c.sources.length, c.id).toBeGreaterThan(0)
            for (const s of c.sources) expect(s.retrieved, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        }
    })

    it.each(['legal', 'commercial'] as InterestType[])(
        'has sorted, non-overlapping %s rate periods',
        (type) => {
            const periods = interestRates[type].periods
            for (const p of periods) {
                expect(p.from, JSON.stringify(p)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
                expect(p.from <= p.to, JSON.stringify(p)).toBe(true)
            }
            for (const [prev, next] of consecutive(periods)) {
                expect(prev.to < next.from, next.from).toBe(true)
            }
        },
    )

    // A gap would make getInterestRate return null for days inside the series
    it.each(['legal', 'commercial'] as InterestType[])('has no gaps in the %s series', (type) => {
        for (const [prev, next] of consecutive(interestRates[type].periods)) {
            const dayAfter = new Date(`${prev.to}T00:00:00Z`)
            dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)
            expect(next.from, prev.to).toBe(dayAfter.toISOString().slice(0, 10))
        }
    })

    it('sets the legal rate per calendar year since 2007', () => {
        for (const p of interestRates.legal.periods.filter((p) => p.from >= '2007')) {
            expect([p.from.slice(5), p.to.slice(5)], p.from).toEqual(['01-01', '12-31'])
            expect(p.from.slice(0, 4), p.from).toBe(p.to.slice(0, 4))
        }
    })

    it('sets the commercial rate per semester', () => {
        for (const p of interestRates.commercial.periods) {
            // 2015 is split on 16 March, when the contract-date rule ended
            if (p.from.startsWith('2015-01') || p.from === '2015-03-16') continue
            expect(['01-01', '07-01'], p.from).toContain(p.from.slice(5))
            expect(['06-30', '12-31'], p.to).toContain(p.to.slice(5))
        }
    })

    it('only has an older-contracts rate between 2013 and 15 March 2015', () => {
        for (const p of interestRates.commercial.periods) {
            if (p.rateForContractsBefore20130316 === undefined) continue
            expect(p.from >= '2013-01-01' && p.to <= '2015-03-15', p.from).toBe(true)
        }
    })
})

describe('German canton names', () => {
    // Only from an official German text, recorded in the canton's sources; never by hand
    it('match scripts/german-canton-names.ts, each with its source', () => {
        const withGerman = cantons.filter((c) => c.name.de !== undefined)
        expect(withGerman.map((c) => c.id).sort()).toEqual(Object.keys(germanCantonNames).sort())
        for (const canton of withGerman) {
            const german = germanCantonNames[canton.id]
            expect(canton.name.de).toBe(german?.name)
            expect(canton.sources).toEqual(german?.sources)
        }
        expect(cantons.filter((c) => c.sources !== undefined)).toEqual(withGerman)
    })
})

describe('courts', () => {
    it('filters by type and arrondissement', () => {
        const result = findCourts({ type: 'enterprise-court', arrondissement: 'oost-vlaanderen' })
        expect(result.map((c) => c.id).sort()).toEqual([
            'enterprise-court-gent-dendermonde',
            'enterprise-court-gent-gent',
            'enterprise-court-gent-oudenaarde',
        ])
    })

    it('filters by kind and judicial area', () => {
        expect(
            findCourts({ kind: 'court', type: 'court-of-appeal', judicialArea: 'mons' }),
        ).toEqual([getCourt('court-of-appeal-mons')])
    })

    it('lists the courts of a canton: one of each type', () => {
        expect(getCourtsForCanton('gent-1').map((c) => c.id)).toEqual([
            'court-of-appeal-gent',
            'court-of-assize-oost-vlaanderen',
            'court-of-first-instance-oost-vlaanderen',
            'enterprise-court-gent',
            'justice-of-the-peace-gent-1',
            'labour-court-gent',
            'labour-court-of-appeal-gent',
            'police-court-oost-vlaanderen',
        ])
        // The capital's cantons have both language courts; Halle-Vilvoorde its own police court
        expect(
            getCourtsForCanton('etterbeek')
                .filter((c) => c.type === 'police-court')
                .map((c) => c.id),
        ).toEqual(['police-court-brussel-fr', 'police-court-brussel-nl'])
        expect(
            getCourtsForCanton('halle')
                .filter((c) => c.type === 'police-court')
                .map((c) => c.id),
        ).toEqual(['police-court-halle'])
        expect(getCourtsForCanton('no-such-canton')).toEqual([])
    })

    it("lists a court's divisions", () => {
        expect(getDivisions('enterprise-court-gent').map((c) => c.id)).toContain(
            'enterprise-court-gent-brugge',
        )
        expect(getDivisions('justice-of-the-peace-philippeville').map((c) => c.kind)).toEqual([
            'seat',
            'seat',
        ])
        expect(getDivisions('justice-of-the-peace-gent-1')).toEqual([])
    })

    it('finds a contact, optionally by label', () => {
        const court = getCourt('court-of-appeal-liege')
        expect(getContact(court, 'email', 'Greffe pénal')).toBe('liege.ca.greffepenal@just.fgov.be')
        expect(getContact(court, 'email')).toMatch(/@just\.fgov\.be$/)
        expect(getContact(court, 'email', 'No such registry')).toBeUndefined()
    })

    it('merges the pages of a bilingual court', () => {
        expect(getCourt('justice-of-the-peace-meise').name).toEqual({
            nl: 'Vredegerecht Meise',
            fr: 'Justice de paix de Meise',
        })
    })
})

describe('getInterestRate', () => {
    it('returns the legal rate for a year', () => {
        expect(getInterestRate('2024-06-15', 'legal')).toEqual({
            rate: 5.75,
            period: { from: '2024-01-01', to: '2024-12-31' },
        })
    })

    it('accepts Date objects as local days', () => {
        expect(getInterestRate(new Date(2023, 0, 1), 'legal')?.rate).toBe(5.25)
    })

    it('depends on the contract date for commercial rates in 2013–2015', () => {
        expect(getInterestRate('2014-06-15', 'commercial')?.rate).toBe(7.5)
        expect(
            getInterestRate('2014-06-15', 'commercial', { contractAfter20130316: true })?.rate,
        ).toBe(8.5)
        expect(getInterestRate('2015-03-16', 'commercial')?.rate).toBe(8.5)
    })

    it('returns null when no rate is on file', () => {
        expect(getInterestRate('1960-01-01', 'legal')).toBeNull()
        const after = getLatestKnownRateDate('commercial')
        expect(getInterestRate(`${Number(after.slice(0, 4)) + 1}-06-01`, 'commercial')).toBeNull()
    })
})

describe('court contact data', () => {
    // ISO 13616: move the first four characters to the end, letters to numbers, mod 97 is 1
    const ibanIsValid = (iban: string) =>
        BigInt(
            (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) =>
                String(c.charCodeAt(0) - 55),
            ),
        ) %
            97n ===
        1n

    it('has values in the canonical form for their type', () => {
        for (const c of courts) {
            for (const k of c.contacts) {
                if (k.type === 'bank-account') expect(ibanIsValid(k.value), c.id).toBe(true)
                else if (k.type === 'email')
                    expect(k.value, c.id).toMatch(/^[^@\sA-Z]+@[^@\sA-Z]+$/)
                else expect(k.value, c.id).toMatch(/^\+32(4[5-9]\d{7}|[1-9]\d{7})$/)
            }
        }
    })

    it('has lowercase e-mail addresses', () => {
        for (const c of courts) {
            for (const k of c.contacts)
                if (k.type === 'email') expect(k.value).toBe(k.value.toLowerCase())
        }
    })

    it('has opening hours in opening_hours syntax', () => {
        for (const c of courts) {
            if (c.openingHours) {
                const day = '(Mo|Tu|We|Th|Fr|Sa|Su)'
                const days = `${day}(-${day})?(,${day}(-${day})?)*`
                const times = '\\d\\d:\\d\\d-\\d\\d:\\d\\d(,\\d\\d:\\d\\d-\\d\\d:\\d\\d)*'
                expect(c.openingHours, c.id).toMatch(
                    new RegExp(`^${days} ${times}(; ${days} ${times})*$`),
                )
            }
        }
    })
})

describe('people', () => {
    // The data holds the contacts of services, never a person's own (scripts/parse/people.ts)
    const records = [...courts, ...prisons, ...housesOfJustice]

    it("has no e-mail address that looks like a person's own", () => {
        const found = records.flatMap((record) =>
            record.contacts
                .filter((c) => c.type === 'email' && isPersonalEmail(c.value))
                .map(() => record.id),
        )
        expect(found).toEqual([])
    })

    it("has no person's name in a contact label", () => {
        const found = records.flatMap((record) =>
            record.contacts
                .filter((c) => c.label !== undefined && withoutPersonName(c.label) !== c.label)
                .map(() => record.id),
        )
        expect(found).toEqual([])
    })
})
