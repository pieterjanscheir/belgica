// Builds the canton label of a justice of the peace. scripts/build-court-labels.ts stores it in
// data/courts.json as `label`, so formatting a name never needs the cantons at run time; the
// courts entry point uses it too, for a record without a stored label.
import type { Locale, Translated } from './schemas/common.ts'
import type { Court } from './schemas/courts.ts'
import { currentVersion, today, type Validity } from './time.ts'

/** The fields of a canton that a label uses */
export interface CantonNameVersion extends Validity {
    name: { nl: string; fr: string; de?: string }
    number?: number
}

const ordinal: Record<Locale, (n: number) => string> = {
    nl: (n) => `${n}e`,
    fr: (n) => (n === 1 ? '1er' : `${n}e`),
    de: (n) => `${n}.`,
}

const words: Record<Locale, { court: string; canton: string }> = {
    nl: { court: 'Vredegerecht', canton: 'kanton' },
    fr: { court: 'Justice de paix', canton: 'canton' },
    de: { court: 'Friedensgericht', canton: 'Kanton' },
}

/**
 * The label of a justice of the peace in each language, from the versions of its canton: the
 * canton as it was on the court's last day, or today for a court that still applies.
 * `undefined` for a court that isn't a justice of the peace (or is one of its seats), and for
 * a canton without versions.
 */
export function buildCourtLabel(
    court: Pick<Court, 'type' | 'kind' | 'name' | 'validTo'>,
    cantonVersions: readonly CantonNameVersion[] | undefined,
): Translated | undefined {
    if (court.type !== 'justice-of-the-peace' || court.kind !== 'court') return undefined
    const canton = cantonVersions && currentVersion(cantonVersions, court.validTo ?? today())
    if (!canton) return undefined
    // Most cantons have no German name: then the one in the court's own language
    const ownLanguage = court.name.nl !== undefined && court.name.fr === undefined ? 'nl' : 'fr'
    const label = (locale: Locale) => {
        const name = canton.name[locale] ?? canton.name[ownLanguage]
        const number = canton.number === undefined ? '' : `${ordinal[locale](canton.number)} `
        return `${words[locale].court} ${number}${words[locale].canton} ${name}`
    }
    return { nl: label('nl'), fr: label('fr'), de: label('de') }
}
