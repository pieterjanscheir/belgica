/**
 * What the documentation's map and court finder fetch from docs/public/map/, written by
 * scripts/build-docs-map.ts, and how a point is placed in the cantons from those files: the
 * boundaries are 23 MB, so the browser gets them per canton rather than as the package's
 * `belgica/canton-boundaries` module, and `contains` from the package does the test.
 */
import { withBase } from 'vitepress'
import { contains, inBox, type BoundingBox } from '../../src/geometry'
import type { MultiPolygon, Position } from '../../src/schemas/geometry'

/** map/index.json */
export interface MapIndex {
    built: string
    cantons: { id: string; box: BoundingBox; colour: number }[]
    /** The justices of the peace with a point from the NGI: [longitude, latitude] */
    courts: { id: string; coordinates: Position }[]
}

/** map/cantons/<id>.json */
export interface CantonFile {
    id: string
    geometry: MultiPolygon
}

/** The cantons' six colours, light and dark: distinct hues at the same weight */
export const PALETTE = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0891b2']

/** Within this distance of another canton, the boundary is too close to call from the map */
export const NEAR_METRES = 25
/** About 50 m in degrees: the boxes of the cantons whose edge may be within NEAR_METRES */
const BOX_MARGIN = 0.0007

const cache = new Map<string, Promise<unknown>>()

/** A file under docs/public/map, fetched once per page load */
export function fetchMap<T>(path: string): Promise<T> {
    let found = cache.get(path)
    if (!found) {
        found = fetch(withBase(`/map/${path}`)).then((r) => {
            if (!r.ok) throw new Error(`${path}: ${r.status} ${r.statusText}`)
            return r.json()
        })
        // A failed fetch is tried again next time
        found.catch(() => cache.delete(path))
        cache.set(path, found)
    }
    return found as Promise<T>
}

export const loadIndex = () => fetchMap<MapIndex>('index.json')
export const loadCanton = (id: string) => fetchMap<CantonFile>(`cantons/${id}.json`)

/** The URL of the overview, for a GeoJSON source */
export const overviewUrl = () => withBase('/map/overview.json')

export interface Placed {
    /** The cantons the point lies in: one, or two on the line between them */
    inside: CantonFile[]
    /** Other cantons whose boundary comes within NEAR_METRES, nearest first */
    near: { canton: CantonFile; metres: number }[]
}

/** Whether a point lies within a bounding box grown by `margin` degrees on every side */
export function nearBox(box: BoundingBox, lon: number, lat: number, margin = 0): boolean {
    return inBox([box[0] - margin, box[1] - margin, box[2] + margin, box[3] + margin], lon, lat)
}

/**
 * Metres from the point to the nearest edge, on a plane tangent at the point: plenty for tens
 * of metres. Infinity when no edge comes within about 100 m.
 */
export function distanceToEdge(geometry: MultiPolygon, lon: number, lat: number): number {
    const k = Math.cos((lat * Math.PI) / 180)
    const toMetres = ([x, y]: Position): [number, number] => [
        (x - lon) * 111_320 * k,
        (y - lat) * 110_574,
    ]
    // About 100 m in degrees: a cheap first filter on each segment. Both ends on the same side,
    // not merely both far: a long straight edge passes the point with its ends far either side.
    const margin = 0.0015
    const far = (p: Position, q: Position, i: 0 | 1, at: number) =>
        Math.min(p[i], q[i]) > at + margin || Math.max(p[i], q[i]) < at - margin
    let best = Infinity
    for (const ring of geometry.coordinates.flat()) {
        for (let i = 1; i < ring.length; i++) {
            const p = ring[i - 1]
            const q = ring[i]
            if (!p || !q || far(p, q, 0, lon) || far(p, q, 1, lat)) continue
            // The point is the origin
            const [a, b] = [toMetres(p), toMetres(q)]
            const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
            const length2 = dx * dx + dy * dy
            const t = length2 ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / length2)) : 0
            best = Math.min(best, Math.hypot(a[0] + t * dx, a[1] + t * dy))
        }
    }
    return best
}

/**
 * The cantons a point lies in, and those whose boundary comes within NEAR_METRES of it, from
 * the per-canton files: only the cantons whose box is near the point are fetched, a few
 * hundred kB rather than the whole dataset. The same test as `findCantonsAt`.
 */
export async function place(longitude: number, latitude: number): Promise<Placed> {
    const index = await loadIndex()
    const candidates = index.cantons.filter((c) => nearBox(c.box, longitude, latitude, BOX_MARGIN))
    const files = await Promise.all(candidates.map((c) => loadCanton(c.id)))
    const inside = files.filter((f) => contains(f.geometry, longitude, latitude))
    const near = files
        .filter((f) => !inside.includes(f))
        .map((canton) => ({ canton, metres: distanceToEdge(canton.geometry, longitude, latitude) }))
        .filter((n) => n.metres <= NEAR_METRES)
        .sort((a, b) => a.metres - b.metres)
    return { inside, near }
}

/** [west, south, east, north] around some cantons' boxes, or undefined for none */
export function boxAround(index: MapIndex, ids: readonly string[]): BoundingBox | undefined {
    const boxes = index.cantons.filter((c) => ids.includes(c.id)).map((c) => c.box)
    if (!boxes.length) return undefined
    return [
        Math.min(...boxes.map((b) => b[0])),
        Math.min(...boxes.map((b) => b[1])),
        Math.max(...boxes.map((b) => b[2])),
        Math.max(...boxes.map((b) => b[3])),
    ]
}
