/**
 * Signs that the cantons may have changed, from sources the sources run reads anyway.
 *
 * The cantons and municipalities come from the annex to the Judicial Code on ejustice, which
 * refuses GitHub's runners, so `pnpm build:cantons` runs by hand (#52). They only change when a
 * law changes the annex or municipalities merge, and both show up elsewhere first: the NGI
 * redraws the canton's boundary, and Statbel's REFNIS register opens or closes a municipality.
 * The build reports each sign, and the sources run opens an issue that says to run it.
 *
 * A new or vanished canton already stops the build (a canton without a boundary or without a
 * court); these are the changes that keep every canton but move what it covers.
 */
import type { Municipality } from '../../src/territory.ts'
import type { RefnisRow } from './refnis.ts'
import type { CantonBoundary } from './types.ts'

/** Whether a record or REFNIS row applies on `day` */
const appliesOn = (day: string, from: string | undefined, to: string | undefined) =>
    (from === undefined || from <= day) && (to === undefined || to >= day)

export function cantonSignals({
    previousBoundaries,
    boundaries,
    refnis,
    municipalities,
    today = new Date().toISOString().slice(0, 10),
}: {
    /** data/canton-boundaries.json before this build */
    previousBoundaries: readonly CantonBoundary[]
    /** The boundaries this build read from the NGI's file */
    boundaries: readonly CantonBoundary[]
    /** Statbel's REFNIS code list */
    refnis: readonly RefnisRow[]
    /** data/municipalities.json */
    municipalities: readonly Municipality[]
    today?: string
}): string[] {
    const signals: string[] = []
    const before = new Map(previousBoundaries.map((b) => [b.id, JSON.stringify(b.geometry)]))
    for (const boundary of boundaries) {
        const previous = before.get(boundary.id)
        if (previous !== undefined && previous !== JSON.stringify(boundary.geometry))
            signals.push(`canton ${boundary.id}: the NGI's boundary changed`)
    }

    const register = new Map(
        refnis
            .filter((row) => row.level === 4 && appliesOn(today, row.from, row.to))
            .map((row) => [row.code, row.name.nl]),
    )
    const data = new Map<string, string>(
        municipalities
            .filter((m) => appliesOn(today, m.validFrom, m.validTo))
            .map((m) => [m.id, m.name.nl]),
    )
    for (const [code, name] of register)
        if (!data.has(code))
            signals.push(`municipality ${code} (${name}): in Statbel's register, not in the data`)
    for (const [code, name] of data)
        if (!register.has(code))
            signals.push(
                `municipality ${code} (${name}): in the data, no longer in Statbel's register`,
            )
    return signals
}
