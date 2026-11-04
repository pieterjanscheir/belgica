/**
 * Builds the canton and arrondissement boundaries from the snapshot of the NGI's "Judicial
 * cantons and arrondissements" GeoPackage (geo.be, WGS 84). One record per canton of
 * data/cantons.json and per arrondissement of data/arrondissements.json, keyed by its id; one
 * the file doesn't name, or a feature nothing matches, is reported and stops the build: that
 * needs a person, not a guess.
 *
 * A feature matches a canton when its Dutch and its French name both give the canton's id
 * (`toId` of the name, with the ordinal as the number), and both agree. Otherwise CANTON_ALIASES
 * maps the feature's canton code to the id by hand. An arrondissement feature has a single name,
 * which matches when it gives the id or one of the arrondissement's names; otherwise
 * ARRONDISSEMENT_ALIASES maps it by hand.
 *
 * Where a law moved an area and the NGI hasn't drawn it yet, canton-corrections.ts moves it.
 */
import { readFileSync } from 'node:fs'

import type { Arrondissement, Canton } from '../../src/territory.ts'
import { toId } from '../id.ts'
import { NGI_CANTONS } from '../sources/catalog.ts'
import { Snapshots } from '../sources/store.ts'
import {
    applyCorrections,
    CANTON_CORRECTIONS,
    type CantonCorrection,
} from './canton-corrections.ts'
import {
    queryGeoPackage,
    readGeoPackageGeometry,
    type MultiPolygonRings,
    type Position,
    type Ring,
} from './geopackage.ts'
import type { ArrondissementBoundary, CantonBoundary, MultiPolygon } from './types.ts'
import { zipEntry } from './zip.ts'

export type { ArrondissementBoundary, CantonBoundary } from './types.ts'

/**
 * The NGI's canton code (`cantoncodedut`) → our canton id, for a feature whose Dutch and French
 * names don't both give the id. The NGI names these seven by their local name in both
 * languages, where the annex to the Judicial Code uses an exonym in the other language.
 */
export const CANTON_ALIASES: Record<string, string> = {
    // 'Canton judiciaire de Halle': the annex says 'Hal'
    '238121': 'halle',
    // "Canton judiciaire d'Oudenaarde": the annex says 'Audenarde'
    '248120': 'oudenaarde',
    // 'Gerechtelijk kanton Eupen-Saint-Vith': the annex says 'Eupen-Sankt-Vith'
    '258101': 'eupen-sankt-vith-1',
    '258102': 'eupen-sankt-vith-2',
    // 'Gerechtelijk kanton Huy': the annex says 'Hoei'
    '258201': 'huy-1',
    '258202': 'huy-2',
    // 'Gerechtelijk kanton Gembloux': the annex says 'Gembloers'
    '258406': 'gembloux',
}

/**
 * The NGI's arrondissement name → our arrondissement id, for a name that gives neither the id
 * nor one of the arrondissement's names. The NGI names the arrondissement of Leuven after its
 * province; its area is that of the Leuven cantons, not of the province, which Halle-Vilvoorde
 * shares with the arrondissement of Brussels.
 */
export const ARRONDISSEMENT_ALIASES: Record<string, string> = {
    'Bruxelles - Brussel': 'brussel',
    'Vlaams Brabant': 'leuven',
}

/** The ordinal that opens a numbered canton's name, per language */
const ORDINALS = {
    nl: ['eerste', 'tweede', 'derde', 'vierde', 'vijfde', 'zesde', 'zevende'],
    fr: ['premier', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'septième'],
}

/**
 * The place and number in a feature's name: 'Eerste gerechtelijk kanton Aalst' →
 * { name: 'Aalst', number: 1 }, "Canton judiciaire d'Arlon" → { name: 'Arlon' }
 */
export function parseName(
    name: string,
    lang: 'nl' | 'fr',
): { name: string; number?: number } | undefined {
    const pattern =
        lang === 'nl' ?
            /^(?:(\S+) )?gerechtelijk kanton (.+)$/i
        :   /^(?:(\S+) )?canton judiciaire (?:d'|de |des )(.+)$/i
    const match = pattern.exec(name)
    if (!match) return undefined
    const [, ordinal, place = ''] = match
    if (ordinal === undefined) return { name: place }
    const number = ORDINALS[lang].indexOf(ordinal.toLowerCase()) + 1
    return number > 0 ? { name: place, number } : undefined
}

/** A feature of the NGI's judicialcanton table */
export interface Feature {
    tgid: string
    namedut: string
    namefre: string
    cantoncodedut: string
    cantoncodefre: string
}

/** Cantons by the id their Dutch name gives, and by the id their French name gives */
export function cantonIndex(cantons: readonly Canton[]) {
    const byName = { nl: new Map<string, Canton>(), fr: new Map<string, Canton>() }
    for (const canton of cantons) {
        byName.nl.set(toId(canton.name.nl, canton.number), canton)
        byName.fr.set(toId(canton.name.fr, canton.number), canton)
    }
    return byName
}

/** The canton a feature is the boundary of, or why none can be told */
export function matchCanton(
    feature: Feature,
    byName: ReturnType<typeof cantonIndex>,
    aliases: Record<string, string> = CANTON_ALIASES,
): { canton: Canton } | { problem: string } {
    const label = `${feature.namedut} / ${feature.namefre} (${feature.cantoncodedut})`
    const alias = aliases[feature.cantoncodedut]
    if (alias !== undefined) {
        const canton = [...byName.nl.values()].find((c) => c.id === alias)
        return canton ? { canton } : { problem: `${label}: alias to unknown canton "${alias}"` }
    }
    const nl = parseName(feature.namedut, 'nl')
    const fr = parseName(feature.namefre, 'fr')
    if (!nl || !fr) return { problem: `${label}: can't read the name` }
    const inNl = byName.nl.get(toId(nl.name, nl.number))
    const inFr = byName.fr.get(toId(fr.name, fr.number))
    if (inNl && inNl === inFr) return { canton: inNl }
    return {
        problem:
            `${label}: Dutch name gives ${inNl?.id ?? 'no canton'}, French name gives ` +
            `${inFr?.id ?? 'no canton'}; add it to CANTON_ALIASES`,
    }
}

/** The arrondissement an NGI arrondissement name names, if one */
export function matchArrondissement(
    name: string,
    arrondissements: readonly Arrondissement[],
    aliases: Record<string, string> = ARRONDISSEMENT_ALIASES,
): Arrondissement | undefined {
    const id = aliases[name] ?? toId(name)
    return arrondissements.find(
        (a) => a.id === id || Object.values(a.name).some((n) => toId(n) === id),
    )
}

/** Coordinates are kept to 7 decimals: about a centimetre, below the source's own precision */
const DECIMALS = 7
export const round = (n: number) => Math.round(n * 10 ** DECIMALS) / 10 ** DECIMALS

/** Twice the signed area of a ring in coordinate units: positive when counter-clockwise */
export function signedArea(ring: Ring): number {
    let sum = 0
    let previous: Position | undefined
    for (const [bx, by] of ring) {
        if (previous) sum += previous[0] * by - bx * previous[1]
        previous = [bx, by]
    }
    return sum
}

/**
 * A ring as GeoJSON wants it: rounded, without consecutive repeats, closed, and wound
 * counter-clockwise for an exterior ring or clockwise for a hole. Vertices are never dropped
 * otherwise: the boundary stays the NGI's.
 */
export function toGeoJsonRing(ring: Ring, kind: 'exterior' | 'hole', label: string): Ring {
    const out: Ring = []
    for (const [x, y] of ring) {
        const position: Position = [round(x), round(y)]
        const last = out.at(-1)
        if (last?.[0] !== position[0] || last[1] !== position[1]) out.push(position)
    }
    const first = out[0]
    const last = out.at(-1)
    if (first?.[0] !== last?.[0] || first?.[1] !== last?.[1])
        throw new Error(`${label}: a ring isn't closed`)
    if (out.length < 4) throw new Error(`${label}: a ring has fewer than three distinct points`)
    const area = signedArea(out)
    if (area === 0) throw new Error(`${label}: a ring has no area`)
    const counterClockwise = area > 0
    return counterClockwise === (kind === 'exterior') ? out : out.reverse()
}

export function toGeoJson(polygons: MultiPolygonRings, label: string): MultiPolygon {
    if (polygons.length === 0) throw new Error(`${label}: no polygon`)
    return {
        type: 'MultiPolygon',
        coordinates: polygons.map(([exterior, ...holes]) => {
            if (!exterior) throw new Error(`${label}: a polygon without rings`)
            return [
                toGeoJsonRing(exterior, 'exterior', label),
                ...holes.map((hole) => toGeoJsonRing(hole, 'hole', label)),
            ]
        }),
    }
}

/** The area of a GeoJSON multipolygon, in square degrees: enough to compare two shapes */
export function area(geometry: MultiPolygon): number {
    // Exterior rings wind counter-clockwise and holes clockwise, so the holes subtract
    return geometry.coordinates.flat().reduce((sum, ring) => sum + signedArea(ring), 0) / 2
}

export interface BoundaryReport {
    /** Features no canton matches, with why */
    unmatched: string[]
    /** Cantons the file has no feature for */
    missing: string[]
    /** What the corrections of canton-corrections.ts did, or that one can go */
    corrections?: string[]
}

const read = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))

/** The GeoPackage in the snapshot of the NGI's file, and the day it was retrieved */
export function readNgiGeoPackage(root: string): { geopackage: Buffer; retrieved: string } {
    const snapshots = new Snapshots(root, 'ngi')
    const entry = snapshots.entry(NGI_CANTONS)
    const path = snapshots.path(NGI_CANTONS)
    if (!entry || !path) throw new Error('No snapshot of the NGI canton boundaries')
    return {
        geopackage: zipEntry(readFileSync(path), /\.gpkg$/),
        retrieved: entry.retrieved,
    }
}

export function buildCantonBoundaries(
    root: string,
    dataDir = 'data',
    corrections: readonly CantonCorrection[] = CANTON_CORRECTIONS,
    readArea?: (code: string) => MultiPolygon,
): { boundaries: CantonBoundary[]; report: BoundaryReport } {
    const { geopackage, retrieved } = readNgiGeoPackage(root)
    const cantons = read(`${dataDir}/cantons.json`) as Canton[]
    const byName = cantonIndex(cantons)
    const report: BoundaryReport = { unmatched: [], missing: [] }

    const features = queryGeoPackage(
        geopackage,
        'SELECT tgid, namedut, namefre, cantoncodedut, cantoncodefre, shape ' +
            'FROM judicialcanton ORDER BY cantoncodedut',
        (row) => ({
            tgid: String(row['tgid']),
            namedut: String(row['namedut']),
            namefre: String(row['namefre']),
            cantoncodedut: String(row['cantoncodedut']),
            cantoncodefre: String(row['cantoncodefre']),
            shape: row['shape'] as Uint8Array,
        }),
    )

    const boundaries = new Map<string, CantonBoundary>()
    for (const feature of features) {
        const match = matchCanton(feature, byName)
        if ('problem' in match) {
            report.unmatched.push(match.problem)
            continue
        }
        const { canton } = match
        const label = `${feature.namedut} (${feature.cantoncodedut})`
        if (boundaries.has(canton.id)) {
            report.unmatched.push(`${label}: a second feature for canton ${canton.id}`)
            continue
        }
        boundaries.set(canton.id, {
            id: canton.id,
            canton: canton.id,
            ngiId: feature.tgid,
            cantonCode: { nl: feature.cantoncodedut, fr: feature.cantoncodefre },
            geometry: toGeoJson(readGeoPackageGeometry(feature.shape), label),
            sources: [{ url: NGI_CANTONS, retrieved }],
        })
    }
    report.missing = cantons.filter((c) => !boundaries.has(c.id)).map((c) => c.id)
    const corrected = applyCorrections([...boundaries.values()], corrections, readArea)
    report.unmatched.push(...corrected.problems)
    report.corrections = corrected.notes
    return {
        boundaries: corrected.boundaries
            .map((boundary) =>
                boundary === boundaries.get(boundary.id) ?
                    boundary
                :   {
                        ...boundary,
                        geometry: toGeoJson(rings(boundary.geometry), boundary.id),
                    },
            )
            .sort((a, b) => a.id.localeCompare(b.id)),
        report,
    }
}

const rings = (geometry: MultiPolygon) => geometry.coordinates as MultiPolygonRings

/**
 * An arrondissement's area may differ this much from the sum of its cantons' (as a fraction):
 * the NGI derives both from the same lines, so more means a feature was matched wrongly
 */
const AREA_TOLERANCE = 0.001

/**
 * The arrondissement boundaries. Each is checked against the cantons of the arrondissement:
 * their areas must add up to its own, which catches an alias to the wrong arrondissement.
 * `cantonBoundaries` are the ones `buildCantonBoundaries` built from the same file.
 */
export function buildArrondissementBoundaries(
    root: string,
    cantonBoundaries: readonly CantonBoundary[],
    dataDir = 'data',
): { boundaries: ArrondissementBoundary[]; report: BoundaryReport } {
    const { geopackage, retrieved } = readNgiGeoPackage(root)
    const arrondissements = read(`${dataDir}/arrondissements.json`) as Arrondissement[]
    const cantons = read(`${dataDir}/cantons.json`) as Canton[]
    const report: BoundaryReport = { unmatched: [], missing: [] }

    const features = queryGeoPackage(
        geopackage,
        'SELECT tgid, name, shape FROM judicialarrondissement ORDER BY name',
        (row) => ({
            tgid: String(row['tgid']),
            name: String(row['name']),
            shape: row['shape'] as Uint8Array,
        }),
    )

    const cantonAreas = new Map<string, number>()
    for (const boundary of cantonBoundaries) {
        const canton = cantons.find((c) => c.id === boundary.canton)
        if (!canton) continue
        const sum = cantonAreas.get(canton.arrondissement) ?? 0
        cantonAreas.set(canton.arrondissement, sum + area(boundary.geometry))
    }

    const boundaries = new Map<string, ArrondissementBoundary>()
    for (const feature of features) {
        const arrondissement = matchArrondissement(feature.name, arrondissements)
        if (!arrondissement) {
            report.unmatched.push(
                `${feature.name}: no arrondissement has this name; add it to ARRONDISSEMENT_ALIASES`,
            )
            continue
        }
        const { id } = arrondissement
        if (boundaries.has(id)) {
            report.unmatched.push(`${feature.name}: a second feature for arrondissement ${id}`)
            continue
        }
        const geometry = toGeoJson(readGeoPackageGeometry(feature.shape), feature.name)
        const expected = cantonAreas.get(id) ?? 0
        if (Math.abs(area(geometry) - expected) > AREA_TOLERANCE * expected) {
            report.unmatched.push(
                `${feature.name}: its area isn't that of the cantons of arrondissement ${id}`,
            )
            continue
        }
        boundaries.set(id, {
            id,
            arrondissement: id,
            ngiId: feature.tgid,
            geometry,
            sources: [{ url: NGI_CANTONS, retrieved }],
        })
    }
    report.missing = arrondissements.filter((a) => !boundaries.has(a.id)).map((a) => a.id)
    return {
        boundaries: [...boundaries.values()].sort((a, b) => a.id.localeCompare(b.id)),
        report,
    }
}

/**
 * The file's JSON: records indented like the other data files, each ring of a geometry on one
 * line, so a diff shows which ring changed without running to millions of lines.
 */
export function stringifyBoundaries(
    boundaries: readonly (CantonBoundary | ArrondissementBoundary)[],
): string {
    const records = boundaries.map((boundary) =>
        JSON.stringify({ ...boundary, geometry: '@geometry@' }, null, 2)
            .replace(/^/gm, '  ')
            .replace('"@geometry@"', stringifyGeometry(boundary.geometry, '    ')),
    )
    return `[\n${records.join(',\n')}\n]\n`
}

/**
 * A multipolygon's JSON with each ring on one line, for a geometry whose opening brace sits
 * after a key at `indent`
 */
export function stringifyGeometry(geometry: MultiPolygon, indent: string): string {
    const rings = geometry.coordinates
        .map(
            (polygon) =>
                `${indent}    [\n` +
                polygon.map((ring) => `${indent}      ${JSON.stringify(ring)}`).join(',\n') +
                `\n${indent}    ]`,
        )
        .join(',\n')
    return `{\n${indent}  "type": "MultiPolygon",\n${indent}  "coordinates": [\n${rings}\n${indent}  ]\n${indent}}`
}
