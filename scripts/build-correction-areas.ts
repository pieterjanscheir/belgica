/**
 * Writes the outline of each sub-municipality a canton correction names
 * (scripts/parse/canton-corrections.ts) to scripts/parse/corrections/<code>.json, from Statbel's
 * statistical sectors: the union of the sectors whose `cd_sub_munty` is the code, converted from
 * Belgian Lambert 2008 to WGS 84.
 *
 * Run with `pnpm build:correction-areas`, by hand, after adding a correction: it downloads about
 * 60 MB and needs the `unzip` command. The outlines of the former municipalities don't change, so
 * the weekly build reads the files instead of the download.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import polygonClipping, { type MultiPolygon as Rings } from 'polygon-clipping'

import { stringifyGeometry, toGeoJson } from './parse/boundaries.ts'
import {
    CANTON_CORRECTIONS,
    correctionAreaPath,
    STATBEL_SECTORS,
} from './parse/canton-corrections.ts'
import { lambert2008ToWgs84 } from './parse/lambert.ts'

interface Sector {
    properties: { cd_sub_munty: string; tx_sub_munty_nl: string }
    geometry:
        | { type: 'Polygon'; coordinates: Rings[number] }
        | { type: 'MultiPolygon'; coordinates: Rings }
}

const res = await fetch(STATBEL_SECTORS)
if (!res.ok) throw new Error(`${STATBEL_SECTORS}: HTTP ${res.status}`)
const dir = mkdtempSync(join(tmpdir(), 'statbel-sectors-'))
const zip = join(dir, 'sectors.zip')
let json: string
try {
    writeFileSync(zip, Buffer.from(await res.arrayBuffer()))
    json = execFileSync('unzip', ['-p', zip, '*.geojson'], { maxBuffer: 1 << 30 }).toString('utf-8')
} finally {
    rmSync(dir, { recursive: true, force: true })
}
const { features } = JSON.parse(json) as { features: Sector[] }

for (const { subMunicipality } of CANTON_CORRECTIONS) {
    const sectors = features.filter((f) => f.properties.cd_sub_munty === subMunicipality.code)
    const names = new Set(sectors.map((f) => f.properties.tx_sub_munty_nl.toLowerCase()))
    if (sectors.length === 0 || names.size !== 1 || !names.has(subMunicipality.name.toLowerCase()))
        throw new Error(
            `${subMunicipality.code}: expected the sectors of ${subMunicipality.name}, found ` +
                `${sectors.length} of ${[...names].join(', ') || 'nothing'}`,
        )
    const [first, ...rest] = sectors.map((f) =>
        f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates,
    )
    // In metres, where the sectors' shared edges meet exactly; projected afterwards
    const union = polygonClipping.union(first ?? [], ...rest)
    const outline = toGeoJson(
        union.map((polygon) => polygon.map((ring) => ring.map(lambert2008ToWgs84))),
        subMunicipality.name,
    )
    const path = fileURLToPath(correctionAreaPath(subMunicipality.code))
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, stringifyGeometry(outline, '') + '\n')
    console.log(
        `${subMunicipality.name}: ${sectors.length} sectors, ${outline.coordinates.length} polygon(s)`,
    )
}
