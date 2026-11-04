/**
 * Corrections to the NGI's canton boundaries, for a law that moved an area from one canton to
 * another and that the NGI hasn't drawn yet. The law is what counts: until the NGI catches up,
 * the build moves the area itself.
 *
 * Each correction names a sub-municipality (deelgemeente, the former municipality before the
 * 1977 mergers) whose outline is kept in scripts/parse/corrections/, made from Statbel's
 * statistical sectors by `pnpm build:correction-areas`. The part of that outline that lies in the
 * `from` canton moves to the `to` canton, so the cantons still cover Belgium once, without gaps or
 * overlaps. Where the NGI's line and Statbel's differ by a few metres, the cut leaves slivers of
 * the `from` canton behind along the area; those go with it.
 *
 * Once the NGI's `from` canton no longer holds the area, the correction does nothing. When the
 * `to` canton holds it, the build says the correction can be removed; when it doesn't, the NGI
 * drew the area somewhere else, and the build stops.
 */
import { readFileSync } from 'node:fs'
import polygonClipping from 'polygon-clipping'

import { area } from './boundaries.ts'
import type { MultiPolygonRings } from './geopackage.ts'
import type { CantonBoundary, MultiPolygon } from './types.ts'

/** Where the outlines of the sub-municipalities come from */
export const STATBEL_SECTORS =
    'https://statbel.fgov.be/sites/default/files/files/opendata/Statistische%20sectoren/sh_statbel_statistical_sectors_3812_20260101.geojson.zip'
/** The day the outlines were made from STATBEL_SECTORS, and the laws last checked */
export const STATBEL_SECTORS_RETRIEVED = '2026-11-04'

export interface CantonCorrection {
    /** The canton the NGI still draws the area in */
    from: string
    /** The canton the law puts it in */
    to: string
    /** The sub-municipality that moved: Statbel's code (`cd_sub_munty`) and its name */
    subMunicipality: { code: string; name: string }
    /** The law that moved it, and where to read it */
    law: { title: string; url: string }
}

export const CANTON_CORRECTIONS: readonly CantonCorrection[] = [
    {
        // Bijvoegsel art. 1, afdeling 6, 13° and 14°, as amended by art. 90, 3° and 4°, of the
        // law of 15 May 2024 on the digitalisation of justice (in force on 1 January 2025): the
        // words "de deelgemeente Mariakerke," leave the second canton and "De deelgemeente
        // Mariakerke, het" opens the third
        from: 'gent-2',
        to: 'gent-3',
        subMunicipality: { code: '44021L', name: 'Mariakerke' },
        law: {
            title: 'Wet van 15 mei 2024, art. 90',
            url: 'https://www.ejustice.just.fgov.be/eli/wet/2024/05/15/2024004698/justel',
        },
    },
]

/** The file that holds a sub-municipality's outline, by its Statbel code */
export const correctionAreaPath = (code: string) =>
    new URL(`corrections/${code}.json`, import.meta.url)

/** A sub-municipality's outline, as `pnpm build:correction-areas` wrote it */
export function readCorrectionArea(code: string): MultiPolygon {
    return JSON.parse(readFileSync(correctionAreaPath(code), 'utf8')) as MultiPolygon
}

/**
 * A piece the cut leaves of the `from` canton is a sliver, and goes with the area, when it
 * borders the area that moved and is smaller than this fraction of it
 */
const SLIVER = 0.01

/**
 * Below this fraction of the outline in the `from` canton, the NGI may have caught up. Statbel's
 * and the NGI's lines differ by a few metres: for Mariakerke, 0.7% of Statbel's outline lies
 * outside the NGI's Gent 2 while the NGI still draws all of it there.
 */
const CAUGHT_UP = 0.01

/**
 * The fraction of the outline the `to` canton must hold before the build says the NGI has
 * caught up; less, and the NGI drew the area somewhere else, which the build reports
 */
const ARRIVED = 1 - 5 * CAUGHT_UP

const percent = (share: number) => `${(share * 100).toFixed(1)}%`

const rings = (geometry: MultiPolygon) => geometry.coordinates as MultiPolygonRings
const multiPolygon = (polygons: MultiPolygonRings): MultiPolygon => ({
    type: 'MultiPolygon',
    coordinates: polygons,
})

/**
 * The boundaries with every correction that still applies made, and a line for each: what moved,
 * or that a correction can go. `toGeoJson` turns the result into the file's form.
 */
export function applyCorrections(
    boundaries: readonly CantonBoundary[],
    corrections: readonly CantonCorrection[] = CANTON_CORRECTIONS,
    readArea: (code: string) => MultiPolygon = readCorrectionArea,
): { boundaries: CantonBoundary[]; notes: string[]; problems: string[] } {
    const byId = new Map(boundaries.map((b) => [b.id, b]))
    const notes: string[] = []
    const problems: string[] = []
    for (const correction of corrections) {
        const { from, to, subMunicipality } = correction
        const label = `${subMunicipality.name} (${from} → ${to}, ${correction.law.title})`
        const source = byId.get(from)
        const target = byId.get(to)
        // A canton without a boundary is reported as missing already
        if (!source || !target) continue
        const outline = readArea(subMunicipality.code)
        const moved = polygonClipping.intersection(rings(source.geometry), rings(outline))
        const movedArea = area(multiPolygon(moved))
        const share = movedArea / area(outline)
        if (share < CAUGHT_UP) {
            const arrived =
                area(
                    multiPolygon(
                        polygonClipping.intersection(rings(target.geometry), rings(outline)),
                    ),
                ) / area(outline)
            if (arrived < ARRIVED)
                problems.push(
                    `${label}: the NGI no longer draws it in ${from} (${percent(share)} left), ` +
                        `but ${to} holds only ${percent(arrived)} of it; check where the NGI ` +
                        'put it',
                )
            else
                notes.push(
                    `${label}: the NGI now draws it in ${to} (${percent(arrived)}, ` +
                        `${percent(share)} left in ${from}); remove the correction from ` +
                        'scripts/parse/canton-corrections.ts',
                )
            continue
        }
        const rest = polygonClipping.difference(rings(source.geometry), rings(outline))
        // Bordering the area that moved: merged with it, the sliver adds no polygon of its own
        const borders = (polygon: MultiPolygonRings[number]) =>
            polygonClipping.union(moved, [polygon]).length <= moved.length
        const isSliver = (polygon: MultiPolygonRings[number]) =>
            area(multiPolygon([polygon])) < SLIVER * movedArea && borders(polygon)
        const slivers = rest.filter(isSliver)
        const kept = rest.filter((polygon) => !isSliver(polygon))
        if (kept.length === 0) {
            problems.push(`${label}: nothing of ${from} would be left`)
            continue
        }
        // The law, then where the outline comes from, after the NGI's file
        const sources = (boundary: CantonBoundary) => [
            ...boundary.sources,
            { url: correction.law.url, retrieved: STATBEL_SECTORS_RETRIEVED },
            { url: STATBEL_SECTORS, retrieved: STATBEL_SECTORS_RETRIEVED },
        ]
        byId.set(from, { ...source, geometry: multiPolygon(kept), sources: sources(source) })
        byId.set(to, {
            ...target,
            geometry: multiPolygon(
                polygonClipping.union(rings(target.geometry), moved, ...slivers),
            ),
            sources: sources(target),
        })
        notes.push(
            `${label}: moved ${percent(share)} of the sub-municipality, ` +
                `the NGI still draws it in ${from}`,
        )
    }
    return { boundaries: boundaries.map((b) => byId.get(b.id) ?? b), notes, problems }
}
