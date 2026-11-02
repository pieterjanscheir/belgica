import municipalitiesData from '../data/municipalities.json'
import policeZonesData from '../data/police-zones.json'
import type { PoliceZoneId } from './ids.generated'
import type { PoliceZone } from './schemas/police-zones'
import type { Municipality } from './schemas/territory'
import { applyingOn, pickVersion, versionsById, type Coverage, type OnDay } from './time'

export type { MunicipalityId, PoliceZoneId } from './ids.generated'
export type { Coverage, OnDay, Validity } from './time'
export type { PoliceZone } from './schemas/police-zones'

/**
 * The police zones describe the situation from the day FOD Financiën's dataset was first read.
 * A zone that disappears in a merger keeps its number and gets a `validTo`; a new one gets a
 * `validFrom`. Lookups for an earlier day throw a `RangeError`.
 */
export const policeZonesCoverage: Coverage = { from: '2026-11-02' }

// The data is validated against the zod schemas in ./schemas (test/schema.test.ts)
/** Every record, every version */
export const policeZones = policeZonesData as readonly PoliceZone[]

// The same municipalities the territory entry point has, without loading the cantons with it
const municipalities = municipalitiesData as readonly Municipality[]
const municipalitiesById = versionsById(municipalities)
const policeZonesById = versionsById(policeZones)
/** The zones by the municipalities they cover: a municipality is in one zone a day */
const byMunicipality = new Map<string, PoliceZone[]>()
for (const zone of policeZones)
    for (const municipality of zone.municipalities)
        byMunicipality.set(municipality, [...(byMunicipality.get(municipality) ?? []), zone])

/** A police zone by its number, e.g. '5415' (Gent): today's version, or the one of a given day */
export function getPoliceZone(id: PoliceZoneId): PoliceZone
/**
 * A police zone by its number, as on a given day (today by default). `undefined` for an unknown
 * number or one not in force that day. A day before the data's coverage throws a `RangeError`.
 */
export function getPoliceZone(id: string, options?: OnDay): PoliceZone | undefined
export function getPoliceZone(id: string, options?: OnDay): PoliceZone | undefined {
    return pickVersion(policeZonesById.get(id), options, policeZonesCoverage, 'police zones')
}

/**
 * The police zone of a municipality on a day (today by default), by REFNIS code, e.g. '44021'
 * for Gent. Every municipality is in exactly one zone; `undefined` for an unknown code.
 */
export function findPoliceZone(
    municipalityId: string,
    options: OnDay = {},
): PoliceZone | undefined {
    return applyingOn(
        byMunicipality.get(municipalityId) ?? [],
        options,
        policeZonesCoverage,
        'police zones',
    )[0]
}

/** The municipalities a police zone covers on a day (today by default), in REFNIS order */
export function getPoliceZoneMunicipalities(id: string, options: OnDay = {}): Municipality[] {
    const zone = getPoliceZone(id, options)
    return (zone?.municipalities ?? []).flatMap((code) => {
        const municipality = pickVersion(
            municipalitiesById.get(code),
            options,
            policeZonesCoverage,
            'police zones',
        )
        // Every zone links to municipalities of the same day (test/police-zones.test.ts); the
        // branch is there for the type
        /* v8 ignore start */
        if (!municipality) return []
        /* v8 ignore stop */
        return [municipality]
    })
}
