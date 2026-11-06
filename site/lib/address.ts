// Placing a geocoded point in the canton boundaries, for the address lookup and the court
// finder. The boundaries are fetched per canton from public/address/ (scripts/build-address.ts).
import type { CourtType } from 'belgica'
import { fetchJson } from './fetch-json'
import type { AddressCandidate, GeocodeSource } from './geocode'
import { contains, distanceToEdge, nearBox, type Polygons } from './geometry'
import type { PerLocale } from './labels'

/** public/address/index.json */
export interface AddressIndex {
    cantons: { canton: string; box: number[] }[]
    regions: Record<string, GeocodeSource | undefined>
}

/** public/address/<canton>.json */
export interface CantonFile {
    canton: string
    name: string
    territory: PerLocale
    split: PerLocale[]
    courts: {
        id: string
        type: CourtType
        name: PerLocale
        address?: { street: string; postalCode: string; city: string }
    }[]
    geometry: Polygons
}

/** The regions' address registers, as the pages credit them */
export const REGISTERS: Record<GeocodeSource, string> = {
    flanders: 'Adressenregister (Digitaal Vlaanderen)',
    brussels: 'UrbIS (paradigm.brussels)',
    wallonia: 'ICAR (SPW)',
}

/** Within this distance of another canton, the boundary is too close to call from the map */
export const NEAR_METRES = 25
/** About 50 m in degrees: the boxes of the cantons whose edge may be within NEAR_METRES */
const BOX_MARGIN = 0.0007

export interface Placed {
    inside: CantonFile[]
    near: { canton: CantonFile; metres: number }[]
}

export const loadAddressIndex = () => fetchJson<AddressIndex>('/address/index.json')

/**
 * The cantons the point lies in, and those whose boundary comes within NEAR_METRES of it.
 * `among` limits the cantons it can lie in to these, as the court finder does for a
 * municipality's; a canton next to them still counts as near, since a point by a line is a case
 * for the law's text whichever municipality the line runs along.
 */
export async function place(
    at: AddressCandidate,
    index: AddressIndex,
    among?: readonly string[],
): Promise<Placed> {
    const { longitude: lon, latitude: lat } = at
    const files = await Promise.all(
        index.cantons
            .filter((c) => nearBox(c.box, lon, lat, BOX_MARGIN))
            .map((c) => fetchJson<CantonFile>(`/address/${c.canton}.json`)),
    )
    const inside = files.filter(
        (f) => (!among || among.includes(f.canton)) && contains(f.geometry, lon, lat),
    )
    const near = files
        .filter((f) => !inside.includes(f))
        .map((canton) => ({ canton, metres: distanceToEdge(canton.geometry, lon, lat) }))
        .filter((n) => n.metres <= NEAR_METRES)
        .sort((a, b) => a.metres - b.metres)
    return { inside, near }
}
