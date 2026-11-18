/** Days, validity periods and coverage: how records relate to time */
import type { Validity } from './schemas/common'

export type { Validity } from './schemas/common'

/** Options for a lookup on a given day */
export interface OnDay {
    /**
     * The day to look up; today in Belgium by default. A `Date` is read as its day in Belgium.
     */
    on?: Date | string
}

// A time with an offset after the day: 'T10:30:00Z', 'T00:30:00+01:00'
const OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/
// Any other offset spelling ('+0100', '+01', a lowercase 'z'): JavaScript and Python
// don't parse those alike
const OTHER_OFFSET = /(?:z|[+-]\d{2}\d{0,2})$/

/**
 * A day as YYYY-MM-DD, in Belgium. A `Date` is an instant: its day in Belgium (Europe/Brussels),
 * whatever the machine's time zone. A string must start with a valid YYYY-MM-DD day: days are
 * compared as strings, so '2013-1-15' would otherwise silently fall in the wrong period. A time
 * after it with an offset (`Z` or `±hh:mm`) is an instant too, read the same way; a time without
 * one is a time in Belgium, so the day is the one written.
 */
export function toDay(date: Date | string): string {
    if (typeof date === 'string') {
        const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(date)
        const [y = NaN, m = NaN, d = NaN] = (match ?? []).slice(1).map(Number)
        // Date.UTC rolls an impossible day over ('2013-02-30' → 2 March), which this catches
        const check = new Date(Date.UTC(y, m - 1, d))
        if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
            throw new RangeError(`Expected a day as YYYY-MM-DD, got '${date}'`)
        }
        const time = date.slice(10)
        if (OFFSET.test(time)) {
            const instant = new Date(date)
            if (Number.isNaN(instant.getTime())) {
                throw new RangeError(`Expected a valid time after the day, got '${date}'`)
            }
            return today(instant)
        }
        if (OTHER_OFFSET.test(time)) {
            throw new RangeError(`Write the offset as Z or ±hh:mm, got '${date}'`)
        }
        return date.slice(0, 10)
    }
    if (Number.isNaN(date.getTime())) throw new RangeError('Invalid Date')
    return today(date)
}

const HOUR = 3_600_000

/** 01:00 UTC on the last Sunday of a month (0-based), when EU summer time starts or ends */
function lastSundayAt1Utc(year: number, month: number): number {
    const lastDay = new Date(Date.UTC(year, month + 1, 0, 1))
    return lastDay.getTime() - lastDay.getUTCDay() * 24 * HOUR
}

/**
 * Today in Belgium as YYYY-MM-DD, whatever the machine's time zone: the day the lookups default
 * to. With `now`, the day in Belgium of that instant. Belgian legal time is UTC+1, and UTC+2 from 01:00 UTC on the last Sunday of March to 01:00
 * UTC on the last Sunday of October (EU Directive 2000/84/EC), computed here so that the Python
 * package, which has no dependencies, can do the same without a time zone database.
 */
export function today(now: Date = new Date()): string {
    const time = now.getTime()
    const year = now.getUTCFullYear()
    const summer = time >= lastSundayAt1Utc(year, 2) && time < lastSundayAt1Utc(year, 9)
    return new Date(time + (summer ? 2 : 1) * HOUR).toISOString().slice(0, 10)
}

/** Whether a record is in force on a day (YYYY-MM-DD): both validity bounds are inclusive */
export function appliesOn(record: Validity, day: string): boolean {
    return (
        (record.validFrom === undefined || record.validFrom <= day) &&
        (record.validTo === undefined || day <= record.validTo)
    )
}

/** The first day a dataset describes */
export interface Coverage {
    readonly from: string
}

/** Every version of the records that share a key, oldest first */
export function versionsBy<T extends Validity>(
    items: readonly T[],
    keyOf: (item: T) => string | undefined,
): Map<string, T[]> {
    const map = new Map<string, T[]>()
    for (const item of items) {
        const key = keyOf(item)
        if (key !== undefined) map.set(key, [...(map.get(key) ?? []), item])
    }
    for (const list of map.values())
        list.sort((a, b) => (a.validFrom ?? '').localeCompare(b.validFrom ?? ''))
    return map
}

/** Every version of each record by id, oldest first */
export function versionsById<T extends { id: string } & Validity>(
    items: readonly T[],
): Map<string, T[]> {
    return versionsBy(items, (item) => item.id)
}

/**
 * With `on`, the version that applies on that day, if any. Without, today's version (see
 * `currentVersion`): a known id always finds a record, and the same one the lists give today.
 */
export function pickVersion<T extends Validity>(
    versions: readonly T[] | undefined,
    options: OnDay | undefined,
    coverage: Coverage,
    dataset: string,
): T | undefined {
    if (options?.on !== undefined) {
        const day = lookupDay(options, coverage.from, dataset)
        return versions?.find((record) => appliesOn(record, day))
    }
    return versions && currentVersion(versions, today())
}

/** The records that apply on the day asked for, today by default */
export function applyingOn<T extends Validity>(
    records: readonly T[],
    options: OnDay,
    coverage: Coverage,
    dataset: string,
): T[] {
    const day = lookupDay(options, coverage.from, dataset)
    return records.filter((record) => appliesOn(record, day))
}

/**
 * A record's version as of a day, from its versions sorted by `validFrom`: the one that applies
 * on that day; for a record that has ended, its last version; for one that hasn't started, its
 * first. Never a version that starts later while an earlier one applies.
 */
export function currentVersion<T extends Validity>(
    versions: readonly T[],
    day: string,
): T | undefined {
    return versions.findLast((v) => (v.validFrom ?? '') <= day) ?? versions[0]
}

/**
 * The day to look up, checked against the first day a dataset describes: before it, the data
 * can't say, and a guess would look like an answer.
 */
export function lookupDay(options: OnDay, coverageFrom: string, dataset: string): string {
    const day = options.on === undefined ? today() : toDay(options.on)
    if (day < coverageFrom) {
        throw new RangeError(
            `The ${dataset} data describes ${coverageFrom} onwards; ${day} is before that`,
        )
    }
    return day
}
