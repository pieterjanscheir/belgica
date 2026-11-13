import {
    getCourtsForCanton,
    getDivisions,
    getJusticeOfThePeace,
    type Court,
    type CourtType,
} from './courts'
import { getMunicipalitiesForPostalCode } from './postal-codes'
import { getCantonsForMunicipality, type Canton, type Municipality } from './territory'
import type { OnDay } from './time'

export interface CantonCourt {
    canton: Canton
    /** The canton's justice of the peace */
    court: Court
    /**
     * The canton covers only part of the municipality: the street address decides, and the
     * canton's `territory` says which part
     */
    partial: boolean
}

/**
 * The justices of the peace for a municipality on a day (today by default), by REFNIS code:
 * one for most municipalities, several for a city split over cantons.
 */
export function findJusticesOfThePeace(municipalityId: string, options: OnDay = {}): CantonCourt[] {
    return getCantonsForMunicipality(municipalityId, options).flatMap((canton) => {
        const court = getJusticeOfThePeace(canton.id, options)
        // Every canton has its court on every day of the coverage (test/data.test.ts); the
        // branch is there for the type
        /* v8 ignore start */
        if (!court) return []
        /* v8 ignore stop */
        return [
            {
                canton,
                court,
                partial: canton.municipalities.some(
                    (m) => m.municipality === municipalityId && m.partial === true,
                ),
            },
        ]
    })
}

/**
 * The courts of a type with jurisdiction over a municipality on a day (today by default), by
 * REFNIS code: the courts whose area, as the law sets it, holds one of its cantons. One court
 * for most municipalities; in Brussels the Dutch- and the French-speaking court; for a city split
 * over cantons, every justice of the peace that serves one of them (the street address decides, see
 * `findJusticesOfThePeace`). The court as a whole: `findDivisionsWithJurisdiction` gives the
 * division. Empty for an unknown code.
 */
export function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options: OnDay = {},
): Court[] {
    const found = new Set<Court>()
    for (const canton of getCantonsForMunicipality(municipalityId, options)) {
        for (const court of getCourtsForCanton(canton.id, options))
            if (court.type === type) found.add(court)
    }
    return [...found]
}

/**
 * Where to file for a municipality on a day (today by default), by REFNIS code: for each court
 * of the type that `findCourtsWithJurisdiction` gives, the division (afdeling, division) whose
 * area holds the municipality, as the royal decrees under art. 186 of the Judicial Code set it.
 * A court that isn't divided, or whose division areas aren't in the data (the police courts),
 * gives itself. A city split over cantons that go to different divisions gives each of them,
 * and the street address decides. Empty for an unknown code.
 *
 *     findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id)
 *     // ['enterprise-court-gent-brugge']
 */
export function findDivisionsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options: OnDay = {},
): Court[] {
    const cantons = new Set(getCantonsForMunicipality(municipalityId, options).map((c) => c.id))
    const found: Court[] = []
    for (const court of findCourtsWithJurisdiction(municipalityId, type, options)) {
        const divisions = getDivisions(court.id, options).filter(
            (d) => d.kind === 'division' && (d.cantons ?? d.municipalities) !== undefined,
        )
        if (divisions.length === 0) {
            found.push(court)
            continue
        }
        // A municipality named in a division's `municipalities` belongs there, even when
        // another division has the rest of its canton
        const named = divisions.filter((d) =>
            (d.municipalities as readonly string[] | undefined)?.includes(municipalityId),
        )
        found.push(
            ...(named.length > 0 ?
                named
            :   divisions.filter((d) => d.cantons?.some((c) => cantons.has(c)))),
        )
    }
    return found
}

/** @deprecated Renamed to `findCourtsWithJurisdiction`; it goes in 1.0. */
export const findCompetentCourts = findCourtsWithJurisdiction

export interface PostalCodeCourts {
    /** One of the municipalities the postal code belongs to */
    municipality: Municipality
    /** Its justices of the peace: one, or several for a city split over cantons */
    justicesOfThePeace: CantonCourt[]
    /** Its courts of the type asked for, as `findCourtsWithJurisdiction` gives them */
    courts: Court[]
}

/**
 * The courts for a postal code on a day (today by default), per municipality. A postal code
 * belongs to one municipality for almost every code; 1040, 1050 and 1804 belong to two, and
 * the street then decides which, so the answer is one entry per municipality and is never
 * collapsed to one. For each: its justices of the peace (`findJusticesOfThePeace`) and its
 * courts of the type asked for (`findCourtsWithJurisdiction`). Empty for an unknown postal code. A
 * street address in a city split over cantons still needs the cantons' `territory` to pick one.
 */
export function findCourtsForPostalCode(
    postalCode: string,
    type: CourtType,
    options: OnDay = {},
): PostalCodeCourts[] {
    return getMunicipalitiesForPostalCode(postalCode, options).map((municipality) => ({
        municipality,
        justicesOfThePeace: findJusticesOfThePeace(municipality.id, options),
        courts: findCourtsWithJurisdiction(municipality.id, type, options),
    }))
}
