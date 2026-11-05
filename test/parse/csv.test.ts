import { describe, expect, it } from 'vitest'

import { tables, toCsv } from '../../scripts/build-csv.ts'

describe('toCsv', () => {
    it('quotes what needs quoting, as RFC 4180 says, after a byte order mark', () => {
        expect(toCsv([{ a: 'x,y', b: 'say "hi"', c: undefined, d: 1 }])).toBe(
            '﻿a,b,c,d\r\n"x,y","say ""hi""",,1\r\n',
        )
    })

    it('opens text that would run as a formula as text, and leaves numbers and phone numbers be', () => {
        expect(
            toCsv([
                {
                    a: '=HYPERLINK("x")',
                    b: '@SUM(A1)',
                    c: '+1+cmd',
                    d: '-2+3',
                    e: '+3226820008',
                    f: -1,
                },
            ]),
        ).toBe(
            '﻿a,b,c,d,e,f\r\n"\'=HYPERLINK(""x"")",\'@SUM(A1),\'+1+cmd,\'-2+3,+3226820008,-1\r\n',
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
