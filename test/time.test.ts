import { describe, expect, it } from 'vitest'

import { appliesOn, currentVersion, lookupDay, today, versionsById } from '../src/time'

describe('appliesOn', () => {
    const record = { validFrom: '2018-09-01', validTo: '2024-12-31' }

    it('includes both ends of the period', () => {
        expect(appliesOn(record, '2018-09-01')).toBe(true)
        expect(appliesOn(record, '2024-12-31')).toBe(true)
    })

    it('excludes the days outside it', () => {
        expect(appliesOn(record, '2018-08-31')).toBe(false)
        expect(appliesOn(record, '2025-01-01')).toBe(false)
    })

    it('treats a missing end as open', () => {
        expect(appliesOn({}, '1900-01-01')).toBe(true)
        expect(appliesOn({ validFrom: '2025-01-01' }, '2099-01-01')).toBe(true)
    })
})

describe('today', () => {
    it('is the day in Belgium, not in UTC or on the machine', () => {
        // Winter (UTC+1): 23:30 UTC is already the next day
        expect(today(new Date('2026-11-18T22:59:59Z'))).toBe('2026-11-18')
        expect(today(new Date('2026-11-18T23:00:00Z'))).toBe('2026-11-19')
        expect(today(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
        // Summer (UTC+2): from 22:00 UTC
        expect(today(new Date('2026-06-30T21:59:59Z'))).toBe('2026-06-30')
        expect(today(new Date('2026-06-30T22:00:00Z'))).toBe('2026-07-01')
    })

    it('switches at 01:00 UTC on the last Sunday of March and of October', () => {
        // 2026: summer time from Sunday 29 March to Sunday 25 October
        expect(today(new Date('2026-03-28T22:30:00Z'))).toBe('2026-03-28')
        expect(today(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-29')
        expect(today(new Date('2026-10-24T21:30:00Z'))).toBe('2026-10-24')
        expect(today(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25')
    })

    it("matches the Europe/Brussels time zone, hour by hour, around each year's changes", () => {
        const brussels = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' })
        for (let year = 1996; year <= 2040; year++) {
            for (const [month, day] of [
                [2, 24],
                [9, 24],
                [11, 31],
            ] as const) {
                const start = Date.UTC(year, month, day)
                for (let hour = 0; hour < 9 * 24; hour++) {
                    // Half past, and the last second before the hour
                    for (const offset of [1_800_000, 3_599_000]) {
                        const now = new Date(start + hour * 3_600_000 + offset)
                        expect(today(now), now.toISOString()).toBe(brussels.format(now))
                    }
                }
            }
        }
    })
})

describe('lookupDay', () => {
    it('defaults to today', () => {
        expect(lookupDay({}, '2000-01-01', 'test')).toBe(today())
    })

    it('names the dataset and its coverage when the day is too early', () => {
        expect(() => lookupDay({ on: '1999-12-31' }, '2000-01-01', 'test')).toThrow(
            'The test data describes 2000-01-01 onwards; 1999-12-31 is before that',
        )
    })
})

describe('currentVersion', () => {
    const versions = [
        { name: 'old', validTo: '2024-12-31' },
        { name: 'now', validFrom: '2025-01-01', validTo: '2026-12-31' },
        { name: 'next', validFrom: '2027-01-01' },
    ]

    it('gives the version that applies, never a later one', () => {
        expect(currentVersion(versions, '2026-10-21')?.name).toBe('now')
        expect(currentVersion(versions, '2024-06-01')?.name).toBe('old')
        expect(currentVersion(versions, '2027-01-01')?.name).toBe('next')
    })

    it('gives the last version of a record that ended, the first of one not started', () => {
        expect(currentVersion([{ name: 'ended', validTo: '2020-01-01' }], '2026-10-21')?.name).toBe(
            'ended',
        )
        expect(
            currentVersion([{ name: 'future', validFrom: '2030-01-01' }], '2026-10-21')?.name,
        ).toBe('future')
        expect(currentVersion<{ validFrom?: string }>([], '2026-10-21')).toBeUndefined()
    })
})

describe('versionsById', () => {
    it('groups the versions of each record, oldest first', () => {
        const map = versionsById([
            { id: 'a', validFrom: '2030-01-01' },
            { id: 'a', validFrom: '2025-01-01' },
            { id: 'b' },
            { id: 'a', validTo: '2024-12-31' },
            { id: 'a', validFrom: '2027-01-01' },
        ])
        expect(map.get('a')?.map((v) => v.validFrom ?? 'first')).toEqual([
            'first',
            '2025-01-01',
            '2027-01-01',
            '2030-01-01',
        ])
        expect(map.get('b')).toEqual([{ id: 'b' }])
    })

    it('puts a version without a start before one with, whichever comes first', () => {
        const map = versionsById([
            { id: 'c', validFrom: '2025-01-01' },
            { id: 'c' },
            { id: 'd' },
            { id: 'd', validFrom: '2025-01-01' },
        ])
        expect(map.get('c')?.map((v) => v.validFrom)).toEqual([undefined, '2025-01-01'])
        expect(map.get('d')?.map((v) => v.validFrom)).toEqual([undefined, '2025-01-01'])
    })
})
