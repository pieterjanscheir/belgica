/**
 * Writes what the documentation's map (docs/.vitepress/components/CantonMap.vue) fetches, to
 * docs/public/map/, from the data files. Generated, not committed; `pnpm docs:dev` and
 * `pnpm docs:build` run it first.
 *
 *     map/index.json             every canton that applies today: its bounding box, its colour on
 *                                the map (0–5; neighbours never share one) and its justice of the
 *                                peace's point, where the NGI has one
 *     map/overview.json          every boundary as one GeoJSON FeatureCollection, simplified to
 *                                about 50 m: the map of Belgium, a few hundred kB instead of 23 MB
 *     map/cantons/<id>.json      one canton's boundary at full precision: drawn when zoomed in,
 *                                and what the court finder places a point in
 *     map/maplibre-gl-worker.mjs MapLibre's worker, which must be served next to the page
 *
 * The browser fetches only the cantons in view or around an address, the way the CourtFull app
 * does (github.com/pieterjanscheir/courtfull).
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

import { assertId } from './id.ts'
import type { CantonBoundary } from '../src/schemas/canton-boundaries.ts'
import type { CourtLocation } from '../src/schemas/court-locations.ts'
import type { Canton } from '../src/schemas/territory.ts'

type Position = readonly number[]
type Ring = readonly Position[]
type Polygons = readonly (readonly Ring[])[]

/** The number of colours on the map: neighbouring cantons never share one */
const COLOURS = 6
/** Degrees, about 50 m: the overview's simplification */
const TOLERANCE = 0.0005

const today = new Date().toISOString().slice(0, 10)
const applies = (r: { validFrom?: string; validTo?: string }) =>
    (r.validFrom === undefined || r.validFrom <= today) &&
    (r.validTo === undefined || r.validTo >= today)

const read = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'))
const boundaries = (read('data/canton-boundaries.json') as CantonBoundary[]).filter(applies)
const cantons = new Map<string, Canton>(
    (read('data/cantons.json') as Canton[]).filter(applies).map((c) => [c.id, c]),
)
const locations = (read('data/court-locations.json') as CourtLocation[]).filter(applies)

function box(polygons: Polygons): number[] {
    const b = [Infinity, Infinity, -Infinity, -Infinity]
    for (const ring of polygons.flat())
        for (const [lon = 0, lat = 0] of ring) {
            b[0] = Math.min(b[0] ?? 0, lon)
            b[1] = Math.min(b[1] ?? 0, lat)
            b[2] = Math.max(b[2] ?? 0, lon)
            b[3] = Math.max(b[3] ?? 0, lat)
        }
    return b.map(round)
}

const round = (n: number) => Math.round(n * 1e5) / 1e5

/** Douglas–Peucker on a closed ring, iterative so the long rings don't overflow the stack */
function simplify(ring: Ring, tolerance: number): Position[] {
    if (ring.length <= 4) return [...ring]
    const keep = new Uint8Array(ring.length)
    keep[0] = keep[ring.length - 1] = 1
    const stack: [number, number][] = [[0, ring.length - 1]]
    while (stack.length) {
        const [first, last] = stack.pop() ?? [0, 0]
        const [ax = 0, ay = 0] = ring[first] ?? []
        const [bx = 0, by = 0] = ring[last] ?? []
        const length = Math.hypot(bx - ax, by - ay)
        let worst = 0
        let index = 0
        for (let i = first + 1; i < last; i++) {
            const [px = 0, py = 0] = ring[i] ?? []
            const d =
                length ?
                    Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length
                :   Math.hypot(px - ax, py - ay)
            if (d > worst) [worst, index] = [d, i]
        }
        if (worst > tolerance) {
            keep[index] = 1
            stack.push([first, index], [index, last])
        }
    }
    const out = ring.filter((_, i) => keep[i])
    // Keep at least a triangle; a ring that shrinks below it is drawn as it was
    return out.length >= 4 ? out.map(([x = 0, y = 0]) => [round(x), round(y)]) : [...ring]
}

// The ids name files: checked before the old map is removed, so a bad one leaves it whole
for (const boundary of boundaries) {
    const canton = cantons.get(boundary.canton)
    if (canton) assertId(canton.id, 'canton id')
}

const dir = new URL('../docs/public/map/', import.meta.url)
rmSync(dir, { recursive: true, force: true })
mkdirSync(new URL('cantons/', dir), { recursive: true })

interface Entry {
    id: string
    box: number[]
    colour: number
    geometry: Polygons
}
const entries: Entry[] = []
let bytes = 0
for (const boundary of boundaries) {
    const canton = cantons.get(boundary.canton)
    if (!canton) throw new Error(`${boundary.canton}: a boundary of a canton that doesn't apply`)
    const geometry = boundary.geometry.coordinates as Polygons
    entries.push({ id: canton.id, box: box(geometry), colour: 0, geometry })
    const file = JSON.stringify({ id: canton.id, geometry: boundary.geometry })
    bytes += file.length
    writeFileSync(new URL(`cantons/${canton.id}.json`, dir), file)
}

// Neighbours: cantons sharing a boundary point. Greedy colouring, the most connected first.
const key = ([x = 0, y = 0]: Position) => `${x.toFixed(5)},${y.toFixed(5)}`
const owners = new Map<string, Set<number>>()
entries.forEach((e, i) => {
    for (const ring of e.geometry.flat())
        for (const p of ring) {
            const k = key(p)
            const set = owners.get(k) ?? new Set()
            set.add(i)
            owners.set(k, set)
        }
})
const neighbours = entries.map(() => new Set<number>())
for (const set of owners.values())
    if (set.size > 1) for (const a of set) for (const b of set) if (a !== b) neighbours[a]?.add(b)
const order = entries
    .map((_, i) => i)
    .sort((a, b) => (neighbours[b]?.size ?? 0) - (neighbours[a]?.size ?? 0))
const colour = new Map<number, number>()
for (const i of order) {
    const taken = new Set([...(neighbours[i] ?? [])].map((n) => colour.get(n)))
    let c = 0
    while (taken.has(c) && c < COLOURS - 1) c++
    colour.set(i, c)
}
entries.forEach((e, i) => (e.colour = colour.get(i) ?? 0))
const clashes = entries.filter((e, i) =>
    [...(neighbours[i] ?? [])].some((n) => entries[n]?.colour === e.colour),
)

/** 'Gent 1': the name alone doesn't tell a city's cantons apart */
const name = (canton: Canton, lang: 'nl' | 'fr') =>
    canton.number === undefined ? canton.name[lang] : `${canton.name[lang]} ${canton.number}`

const index = {
    built: today,
    cantons: entries.map(({ id, box, colour }) => ({ id, box, colour })),
    // The justices of the peace, where the NGI's point matches the court's address
    courts: locations.map((l) => ({ id: l.court, coordinates: l.geometry.coordinates })),
}
writeFileSync(new URL('index.json', dir), JSON.stringify(index))

const overview = JSON.stringify({
    type: 'FeatureCollection',
    features: entries.map((e, i) => {
        const canton = cantons.get(e.id)
        return {
            type: 'Feature',
            id: i,
            properties: {
                id: e.id,
                colour: e.colour,
                nl: canton ? name(canton, 'nl') : e.id,
                fr: canton ? name(canton, 'fr') : e.id,
            },
            geometry: {
                type: 'MultiPolygon',
                coordinates: e.geometry.map((polygon) =>
                    polygon.map((ring) => simplify(ring, TOLERANCE)),
                ),
            },
        }
    }),
})
writeFileSync(new URL('overview.json', dir), overview)
copyFileSync(
    new URL('../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url),
    new URL('maplibre-gl-worker.mjs', dir),
)

const kb = (n: number) => `${Math.round(n / 1024)} KB`
console.log(
    `docs map: ${entries.length} cantons, overview ${kb(overview.length)}, cantons ${kb(bytes)} in all, ${index.courts.length} court points` +
        (clashes.length ? `; ${clashes.length} cantons share a colour with a neighbour` : ''),
)
