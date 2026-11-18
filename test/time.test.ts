import { afterEach, describe, expect, it, vi } from 'vitest'

import { appliesOn, currentVersion, lookupDay, today, toDay, versionsById } from '../src/time'

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

    it('gives the new day on the nights summer time starts and ends', () => {
        // 2026: summer time from Sunday 29 March to Sunday 25 October
        expect(today(new Date('2026-03-28T22:30:00Z'))).toBe('2026-03-28')
        expect(today(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-29')
        expect(today(new Date('2026-10-24T21:30:00Z'))).toBe('2026-10-24')
        expect(today(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25')
    })

    it("matches the Europe/Brussels time zone, hour by hour, around each year's changes", () => {
        const brussels = new Intl.DateTimeFormat('en', {
            timeZone: 'Europe/Brussels',
            calendar: 'gregory',
            numberingSystem: 'latn',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
        // From the parts: no locale's layout is guaranteed to be YYYY-MM-DD
        const brusselsDay = (now: Date) => {
            const parts = Object.fromEntries(
                brussels.formatToParts(now).map((part) => [part.type, part.value]),
            )
            return `${parts['year']}-${parts['month']}-${parts['day']}`
        }
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
                        expect(today(now), now.toISOString()).toBe(brusselsDay(now))
                    }
                }
            }
        }
    })
})

describe('toDay', () => {
    it('reads a Date as its day in Belgium (#164)', () => {
        // 00:30 on 1 January in Belgium, whatever the machine's time zone
        expect(toDay(new Date('2024-12-31T23:30:00Z'))).toBe('2025-01-01')
        expect(toDay(new Date('2026-06-30T21:59:59Z'))).toBe('2026-06-30')
        expect(() => toDay(new Date('nonsense'))).toThrow(RangeError)
    })

    it('reads a string with an offset as the same instant, however it is written (#164)', () => {
        expect(toDay('2024-12-31T23:30:00Z')).toBe('2025-01-01')
        expect(toDay('2025-01-01T00:30:00+01:00')).toBe('2025-01-01')
        expect(toDay('2024-06-15T10:30:00Z')).toBe('2024-06-15')
        expect(toDay('2024-06-15T23:30:00-05:00')).toBe('2024-06-16')
    })

    it('keeps the day written for a string without an offset', () => {
        expect(toDay('2024-12-31')).toBe('2024-12-31')
        expect(toDay('2024-12-31T23:30:00')).toBe('2024-12-31')
    })

    it('refuses an offset written another way, and an invalid time', () => {
        for (const bad of [
            '2024-12-31T23:30:00+0100',
            '2024-12-31T23:30:00+01',
            '2024-12-31T23:30:00z',
            '2024-12-31T99:99Z',
        ]) {
            expect(() => toDay(bad), bad).toThrow(RangeError)
        }
    })

    it('still refuses a day that is not YYYY-MM-DD', () => {
        for (const bad of ['2013-1-15', '2013-02-30', 'yesterday', '']) {
            expect(() => toDay(bad), bad).toThrow(RangeError)
        }
    })
})

describe('lookupDay', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('defaults to today in Belgium', () => {
        // One clock for the lookup and the expectation: 00:00 on 1 July in Belgium
        vi.useFakeTimers({ now: new Date('2026-06-30T22:00:00Z') })
        expect(lookupDay({}, '2000-01-01', 'test')).toBe('2026-07-01')
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
