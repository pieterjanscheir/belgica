import { describe, expect, it } from 'vitest'

import { tables, toCsv } from '../../scripts/build-csv.ts'
import { proceduralIndemnities } from '../../src/procedural-indemnities'

describe('toCsv', () => {
    it('quotes what needs quoting, as RFC 4180 says, after a byte order mark', () => {
        expect(toCsv([{ a: 'x,y', b: 'say "hi"', c: undefined, d: 1 }])).toBe(
            '﻿a,b,c,d\r\n"x,y","say ""hi""",,1\r\n',
        )
    })

    it('takes the columns of every row', () => {
        expect(toCsv([{ a: 1 }, { b: 2 }])).toBe('﻿a,b\r\n1,\r\n,2\r\n')
    })
})

describe('tables', () => {
    it('has a row for every record', () => {
        expect(tables['courts']).toHaveLength(347)
        expect(tables['cantons']).toHaveLength(162)
        for (const [name, rows] of Object.entries(tables))
            expect(rows.length, name).toBeGreaterThan(0)
    })

    it("has each justice of the peace's canton label", () => {
        const gent1 = tables['courts']?.find((r) => r['id'] === 'justice-of-the-peace-gent-1')
        expect(gent1?.['label_fr']).toBe('Justice de paix 1er canton Gand')
        const appeal = tables['courts']?.find((r) => r['id'] === 'court-of-appeal-gent')
        expect(appeal?.['label_nl']).toBeUndefined()
    })

    it('has every bracket of every procedural indemnity tariff, and the indexations', () => {
        const rows = tables['procedural-indemnities'] ?? []
        for (const tariff of proceduralIndemnities.tariffs) {
            const own = rows.filter((r) => r['tariff'] === tariff.id)
            expect(own, tariff.id).toHaveLength(tariff.brackets.length + 1)
            tariff.brackets.forEach((b, i) => {
                expect(own[i], `${tariff.id} ${i}`).toMatchObject({
                    non_monetary: false,
                    up_to: b.upTo ?? undefined,
                    min: b.min,
                    base: b.base,
                    max: b.max,
                })
            })
            expect(own.at(-1), tariff.id).toMatchObject({
                non_monetary: true,
                ...tariff.nonMonetary,
            })
        }
        expect(tables['procedural-indemnity-indexations']?.at(-1)).toMatchObject({
            from: '2025-03-01',
            method: 'formula',
            index: 166.05,
        })
    })

    it('has the years a holiday was moved, next to the rules', () => {
        expect(tables['public-holidays']).toHaveLength(10)
        expect(tables['public-holiday-replacements']).toContainEqual(
            expect.objectContaining({
                holiday: 'ascension',
                replaces: '2008-05-01',
                day: '2008-05-02',
            }),
        )
    })
})
