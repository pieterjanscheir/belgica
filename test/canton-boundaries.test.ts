import { describe, expect, expectTypeOf, it } from 'vitest'

import * as root from '../src'
import {
    cantonBoundaries,
    cantonBoundariesCoverage,
    findCantonsAt,
    getCantonBoundary,
    type CantonBoundary,
    type Ring,
} from '../src/canton-boundaries'
import { NGI_CANTONS } from '../scripts/sources/catalog'
import { CANTON_CORRECTIONS, STATBEL_SECTORS } from '../scripts/parse/canton-corrections'
import { appliesOn, cantons, getMunicipality, toDay } from '../src'

const today = toDay(new Date())
const current = cantonBoundaries.filter((b) => appliesOn(b, today))

/** Twice the signed area of a ring: positive when counter-clockwise */
function signedArea(ring: Ring): number {
    let sum = 0
    for (let i = 1; i < ring.length; i++) {
        const [ax, ay] = ring[i - 1] ?? [0, 0]
        const [bx, by] = ring[i] ?? [0, 0]
        sum += ax * by - bx * ay
    }
    return sum
}

/** The area of a polygon in km², close enough at Belgium's latitude for a sanity check */
function areaKm2([exterior = [], ...holes]: Ring[]): number {
    const km = (ring: Ring) => {
        const lat = (ring[0]?.[1] ?? 0) * (Math.PI / 180)
        return (Math.abs(signedArea(ring)) / 2) * 111.32 * 111.32 * Math.cos(lat)
    }
    return km(exterior) - holes.reduce((sum, hole) => sum + km(hole), 0)
}

/**
 * A point inside a polygon: the middle of the first span of a horizontal line through the
 * centre of the exterior ring's bounding box, which lies inside the ring and not in a hole
 * for every canton (checked below)
 */
function interiorPoint([exterior = []]: Ring[]): [number, number] {
    const lats = exterior.map(([, lat]) => lat)
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2
    const crossings: number[] = []
    for (let i = 1; i < exterior.length; i++) {
        const [ax, ay] = exterior[i - 1] ?? [0, 0]
        const [bx, by] = exterior[i] ?? [0, 0]
        if (ay > lat !== by > lat) crossings.push(((bx - ax) * (lat - ay)) / (by - ay) + ax)
    }
    crossings.sort((a, b) => a - b)
    return [((crossings[0] ?? 0) + (crossings[1] ?? 0)) / 2, lat]
}

describe('canton boundaries', () => {
    it('has one boundary for every canton, and a canton for every boundary', () => {
        expect(current.map((b) => b.id).sort()).toEqual(cantons.map((c) => c.id).sort())
        for (const b of cantonBoundaries) expect(b.canton, b.id).toBe(b.id)
    })

    it("carries the NGI's object id and canton code, prefixed per language around Brussels", () => {
        const ids = new Set<string>()
        for (const b of cantonBoundaries) {
            expect(b.ngiId, b.id).toMatch(/^\{[0-9A-F]{8}(-[0-9A-F]{4}){3}-[0-9A-F]{12}\}$/)
            expect(ids.has(b.ngiId), b.id).toBe(false)
            ids.add(b.ngiId)
            // The same six digits in both languages; an N/F prefix in Brussels-Capital, and in
            // Sint-Genesius-Rode
            expect(b.cantonCode.nl, b.id).toMatch(/^N?\d{6}$/)
            expect(b.cantonCode.fr, b.id).toBe(b.cantonCode.nl.replace(/^N/, 'F'))
            const canton = cantons.find((c) => c.id === b.canton)
            const inCapital = canton?.municipalities.some(
                (m) => getMunicipality(m.municipality).province === '04000',
            )
            if (inCapital) expect(b.cantonCode.nl, b.id).toMatch(/^N/)
        }
        expect(getCantonBoundary('sint-genesius-rode').cantonCode).toEqual({
            nl: 'N238122',
            fr: 'F238122',
        })
    })

    it('cites the NGI file every record was read from, and the law and outline of a correction', () => {
        // From the data, not the list: a correction the NGI has caught up with applies nowhere
        const urls = new Map<string, string[]>(
            cantonBoundaries.map((b) => [b.id, b.sources.map((s) => s.url)]),
        )
        for (const b of cantonBoundaries) {
            const laws = CANTON_CORRECTIONS.filter((c) => c.from === b.id || c.to === b.id).map(
                (c) => c.law.url,
            )
            expect(
                [[NGI_CANTONS], ...laws.map((law) => [NGI_CANTONS, law, STATBEL_SECTORS])],
                b.id,
            ).toContainEqual(urls.get(b.id))
            expect(b.sources[0]?.retrieved, b.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        }
        // Both cantons of a correction cite it, or neither does
        for (const { from, to } of CANTON_CORRECTIONS)
            expect(urls.get(from)?.length, `${from} → ${to}`).toBe(urls.get(to)?.length)
    })

    // A million positions: collected in plain loops, with one assertion at the end
    it('has valid GeoJSON multipolygons in WGS 84, within Belgium, to 7 decimals', () => {
        const problems: string[] = []
        for (const b of cantonBoundaries) {
            if (b.geometry.coordinates.length === 0) problems.push(`${b.id}: no polygon`)
            for (const [exterior, ...holes] of b.geometry.coordinates) {
                if (!exterior) {
                    problems.push(`${b.id}: a polygon without rings`)
                    continue
                }
                for (const ring of [exterior, ...holes]) {
                    const [first, last] = [ring[0], ring.at(-1)]
                    const closed = first?.[0] === last?.[0] && first?.[1] === last?.[1]
                    if (ring.length < 4 || !closed)
                        problems.push(`${b.id}: a ring isn't closed, or has fewer than 4 points`)
                    for (const [lon, lat] of ring) {
                        if (lon < 2.5 || lon > 6.5 || lat < 49.4 || lat > 51.6)
                            problems.push(`${b.id}: ${lon}, ${lat} is outside Belgium`)
                        if (lon !== Number(lon.toFixed(7)) || lat !== Number(lat.toFixed(7)))
                            problems.push(`${b.id}: ${lon}, ${lat} has more than 7 decimals`)
                    }
                }
                // RFC 7946: exterior rings counter-clockwise, holes clockwise
                if (signedArea(exterior) <= 0) problems.push(`${b.id}: exterior ring clockwise`)
                for (const hole of holes)
                    if (signedArea(hole) >= 0) problems.push(`${b.id}: hole counter-clockwise`)
            }
        }
        expect(problems.slice(0, 10)).toEqual([])
    })

    // Belgium is 30,689 km²: a missing, doubled or broken polygon would show here
    it("adds up to Belgium's area", () => {
        const total = current.reduce(
            (sum, b) => sum + b.geometry.coordinates.reduce((s, p) => s + areaKm2(p), 0),
            0,
        )
        expect(total).toBeGreaterThan(30_400)
        expect(total).toBeLessThan(30_900)
    })

    it("doesn't overlap: a point inside each canton finds only that canton", () => {
        for (const b of current) {
            const [lon, lat] = interiorPoint(b.geometry.coordinates[0] ?? [])
            expect(
                findCantonsAt(lon, lat).map((c) => c.id),
                b.id,
            ).toEqual([b.id])
        }
    })

    it('is only in its own entry point, not the package root', () => {
        expect('findCantonsAt' in root).toBe(false)
        expect('cantonBoundaries' in root).toBe(false)
    })
})

describe('getCantonBoundary', () => {
    it('finds the boundary of a canton, by canton id', () => {
        expect(getCantonBoundary('gent-1').canton).toBe('gent-1')
        expect(getCantonBoundary('gent-1', { on: cantonBoundariesCoverage.from })?.id).toBe(
            'gent-1',
        )
        expect(getCantonBoundary('no-such-canton')).toBeUndefined()
        expect(() => getCantonBoundary('gent-1', { on: '2026-01-01' })).toThrow(RangeError)
    })

    it('types lookups by id', () => {
        expectTypeOf(getCantonBoundary('gent-1')).toEqualTypeOf<CantonBoundary>()
        expectTypeOf(getCantonBoundary('x' as string)).toEqualTypeOf<CantonBoundary | undefined>()
    })
})

describe('findCantonsAt', () => {
    // Places in split cities whose canton the annex's text settles, and what the NGI's
    // boundaries say about them. The text is quoted in each canton's `territory`.
    it.each([
        // Antwerpen 1: the right bank north of the line of the Brouwersvliet (the Eilandje)
        ['MAS, Hanzestedenplaats, Antwerpen', 4.4047, 51.229, 'antwerpen-1'],
        // Antwerpen 4: the district of Borgerhout
        ['Moorkensplein, Borgerhout', 4.436, 51.211, 'antwerpen-4'],
        // Antwerpen 5: the historic centre, and the left bank of the Scheldt
        ['Grote Markt, Antwerpen', 4.3997, 51.2213, 'antwerpen-5'],
        ['Linkeroever, Antwerpen', 4.37, 51.22, 'antwerpen-5'],
        // Antwerpen 7: the district of Wilrijk
        ['Bist, Wilrijk', 4.395, 51.17, 'antwerpen-7'],
        // Merksem: the district of Merksem (the Sportpaleis is at Schijnpoortweg 119, Merksem)
        ['Sportpaleis, Merksem', 4.4426, 51.2301, 'merksem'],
        // Gent 1: the centre, from the Rabot round to the Sint-Pietersnieuwstraat
        ['Sint-Baafskathedraal, Gent', 3.7268, 51.053, 'gent-1'],
        ['Korenmarkt, Gent', 3.7215, 51.0545, 'gent-1'],
        // Gent 2: Drongen, across the canal Gent-Oostende from Mariakerke
        ['Drongen', 3.66, 51.05, 'gent-2'],
        // Gent 3: the sub-municipality of Mariakerke since 1 January 2025 (law of 15 May 2024),
        // which the NGI still draws in Gent 2 (scripts/parse/canton-corrections.ts)
        ['Weefselstraat, Mariakerke', 3.688262, 51.070005, 'gent-3'],
        ['Mariakerke', 3.68, 51.073, 'gent-3'],
        // Gent 5: Destelbergen and the east of Gent, from the Dendermondsesteenweg
        ['Dampoort, Gent', 3.7404, 51.0564, 'gent-5'],
        // Brussel 1: between the Anspachlaan, the Grasmarkt and the Bergstraat
        ['Grand-Place, Brussel', 4.3525, 50.8467, 'brussel-1'],
        // Brussel 2: east of the Wetstraat and the Regentlaan, to Etterbeek and Elsene
        ['Rue Wiertz, Brussel (European Parliament)', 4.3753, 50.8382, 'brussel-2'],
        // Brussel 3: west of the Willebroek canal and the Van Praetlaan (Laken, Heizel)
        ['Atomium, Laken', 4.3415, 50.8949, 'brussel-3'],
        // Brussel 4: east of the canal and north of the Saincteletteplein (Haren)
        ['Haren', 4.4139, 50.8911, 'brussel-4'],
        // Liège 1: east of the Meuse, from the pont de Fétinne (Outremeuse)
        ['Place du Congrès, Liège', 5.5833, 50.6397, 'liege-1'],
        // Liège 2: the left bank south of the rue du Pont (the centre, Guillemins)
        ['Place Saint-Lambert, Liège', 5.5734, 50.6454, 'liege-2'],
        ['Gare de Liège-Guillemins', 5.5665, 50.6246, 'liege-2'],
        // Charleroi 1: the former city of Charleroi, Couillet, Dampremy and Gilly
        ['Place Charles II, Charleroi', 4.4447, 50.4108, 'charleroi-1'],
        ['Gare de Charleroi-Central', 4.438, 50.4047, 'charleroi-1'],
    ])('%s is in canton %s', (_place, lon, lat, canton) => {
        expect(findCantonsAt(lon, lat).map((c) => c.id)).toEqual([canton])
    })

    it('finds the one canton of a municipality that isn’t split', () => {
        const [canton, ...rest] = findCantonsAt(3.745, 50.995)
        expect(rest).toEqual([])
        expect(canton).toMatchObject({ id: 'merelbeke-melle', name: { nl: 'Merelbeke-Melle' } })
    })

    it('finds nothing outside Belgium, and nothing for latitude and longitude swapped', () => {
        expect(findCantonsAt(2.3522, 48.8566)).toEqual([]) // Paris
        expect(findCantonsAt(2.9, 51.4)).toEqual([]) // the North Sea
        expect(findCantonsAt(51.053, 3.7268)).toEqual([]) // Sint-Baafs, the wrong way round
    })

    it('gives both cantons for a point on the line between them', () => {
        // The first vertices of Aalst 1's ring lie on its line with Ninove; stop at the first
        const [exterior = []] = getCantonBoundary('aalst-1').geometry.coordinates[0] ?? []
        let shared: string[] = []
        for (const [lon, lat] of exterior.slice(0, 100)) {
            const found = findCantonsAt(lon, lat).map((c) => c.id)
            if (found.length === 2) {
                shared = found
                break
            }
        }
        expect(shared).toContain('aalst-1')
        expect(shared).toHaveLength(2)
    })

    it('answers for a day, and throws before the coverage or for bad coordinates', () => {
        expect(findCantonsAt(3.745, 50.995, { on: cantonBoundariesCoverage.from })).toHaveLength(1)
        expect(() => findCantonsAt(3.745, 50.995, { on: '2025-06-01' })).toThrow(
            /2026-10-21 onwards/,
        )
        expect(() => findCantonsAt(NaN, 50)).toThrow(RangeError)
        expect(() => findCantonsAt(3.7, Infinity)).toThrow(RangeError)
    })
})
