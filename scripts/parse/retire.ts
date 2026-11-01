/**
 * Carries the records of the previous build over into a fresh one, so that a record a source
 * stops listing is retired rather than deleted: ids are public API, and a court that closes is
 * still the court a summons of last year named.
 *
 * - A record the source still lists is replaced by the fresh one, keeping its `validFrom`.
 * - A record the source no longer lists is kept, with `validTo` set to the day before the walk
 *   that missed it (the sources check only narrows it to the days between two runs; see docs/guide/data-quality.md).
 * - A record the source newly lists gets `validFrom` set to the day of the walk. In the very
 *   first build there is no previous data, and no record gets a `validFrom`.
 * - A record that returns after it was retired becomes a new version of the same id: the
 *   retired version stays, the fresh one starts on the day of the walk.
 */
import type { Validity } from '../../src/time.ts'

export interface Dated extends Validity {
    id: string
}

/** The day before a YYYY-MM-DD day */
export function dayBefore(day: string): string {
    const date = new Date(`${day}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() - 1)
    return date.toISOString().slice(0, 10)
}

/** The validity fields first, then the rest, for stable diffs */
function dated<T extends Dated>(record: T, validity: Validity): T {
    const { id, ...rest } = record
    const fields: Partial<Record<keyof Validity, unknown>> = rest
    delete fields.validFrom
    delete fields.validTo
    return {
        id,
        ...(validity.validFrom !== undefined ? { validFrom: validity.validFrom } : {}),
        ...(validity.validTo !== undefined ? { validTo: validity.validTo } : {}),
        ...rest,
    } as T
}

export function carryOver<T extends Dated>(
    previous: readonly T[],
    fresh: readonly T[],
    day: string,
): T[] {
    const freshById = new Map(fresh.map((record) => [record.id, record]))
    const out: T[] = []
    const seen = new Set<string>()
    const versions = new Map<string, T[]>()
    for (const record of previous)
        versions.set(record.id, [...(versions.get(record.id) ?? []), record])
    for (const [id, list] of versions) {
        seen.add(id)
        const sorted = [...list].sort((a, b) =>
            (a.validFrom ?? '').localeCompare(b.validFrom ?? ''),
        )
        const last = sorted.pop()
        /* v8 ignore next */
        if (!last) continue
        out.push(...sorted)
        const now = freshById.get(id)
        if (!now) {
            out.push(
                last.validTo !== undefined ?
                    last
                :   dated(last, { ...last, validTo: dayBefore(day) }),
            )
        } else if (last.validTo !== undefined) {
            // Retired before, and listed again: a new version
            out.push(last, dated(now, { validFrom: day }))
        } else {
            out.push(dated(now, last.validFrom !== undefined ? { validFrom: last.validFrom } : {}))
        }
    }
    for (const record of fresh) {
        if (seen.has(record.id)) continue
        out.push(previous.length > 0 ? dated(record, { validFrom: day }) : record)
    }
    return out.sort(
        (a, b) => a.id.localeCompare(b.id) || (a.validFrom ?? '').localeCompare(b.validFrom ?? ''),
    )
}

/** The day of the walk that produced a set of snapshots: the latest day a page was checked */
export function walkDay(entries: readonly { checked: string }[]): string {
    const day = entries
        .map((entry) => entry.checked)
        .sort()
        .at(-1)
    if (!day) throw new Error('No snapshots')
    return day
}
