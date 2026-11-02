/**
 * The police zones, from the snapshot of FOD Financiën's "Police zones" dataset (AAPD, CC BY 4.0):
 * a zipped shapefile whose attribute tables are read here, without the geometry.
 *
 * - `Apn_PoZo.dbf`: one row per zone, with its official number (`PoZoKey`, e.g. 5415), its name
 *   in Dutch, French and German (the municipalities it covers, in capitals, as the source writes
 *   them) and its short name (`Alias`, e.g. HESBAYE).
 * - `Tbl_AdMu_PoZo.dbf`: one row per municipality, by REFNIS code, with the number of its zone.
 *
 * Every municipality of data/municipalities.json must be in exactly one zone, and every zone must
 * cover one: anything else stops the build, since it means the zones or the municipalities
 * changed and a person has to look.
 */
import { execFileSync } from 'node:child_process'

import { POLICE_ZONES_ZIP } from '../sources/catalog.ts'
import { Snapshots } from '../sources/store.ts'
import { readDbf } from './dbf.ts'
import type { PoliceZone } from './types.ts'

/** The zones and the municipality table of the zip, as rows */
export interface PoliceZoneTables {
    zones: Record<string, string>[]
    municipalities: Record<string, string>[]
}

/** The police zones from the two tables; `problems` stop the build */
export function toPoliceZones(
    tables: PoliceZoneTables,
    municipalityIds: readonly string[],
    source: { url: string; retrieved: string },
): { zones: PoliceZone[]; problems: string[] } {
    const problems: string[] = []
    const known = new Set(municipalityIds)
    const byZone = new Map<string, string[]>()
    const zoneOf = new Map<string, string>()
    for (const row of tables.municipalities) {
        const municipality = row['ADMUKEY'] ?? ''
        const zone = row['POZOKEY'] ?? ''
        if (!known.has(municipality))
            problems.push(`police zones: municipality ${municipality} isn't in municipalities.json`)
        const previous = zoneOf.get(municipality)
        if (previous !== undefined && previous !== zone)
            problems.push(
                `police zones: municipality ${municipality} is in ${previous} and ${zone}`,
            )
        zoneOf.set(municipality, zone)
        byZone.set(zone, [...(byZone.get(zone) ?? []), municipality])
    }
    for (const id of municipalityIds)
        if (!zoneOf.has(id)) problems.push(`police zones: municipality ${id} is in no zone`)

    const zones: PoliceZone[] = []
    for (const row of tables.zones) {
        const id = row['PoZoKey'] ?? ''
        if (!/^\d{4}$/.test(id)) {
            problems.push(`police zones: a zone has no number: ${JSON.stringify(row)}`)
            continue
        }
        const municipalities = [...new Set(byZone.get(id) ?? [])].sort()
        if (municipalities.length === 0)
            problems.push(`police zones: zone ${id} has no municipality`)
        const alias = row['Alias']
        zones.push({
            id,
            name: { nl: row['NameDUT'] ?? '', fr: row['NameFRE'] ?? '', de: row['NameGER'] ?? '' },
            ...(alias ? { alias } : {}),
            municipalities,
            sources: [source],
        })
        byZone.delete(id)
    }
    for (const zone of byZone.keys())
        problems.push(`police zones: the municipality table has zone ${zone}, the zones don't`)
    return { zones: zones.sort((a, b) => a.id.localeCompare(b.id)), problems }
}

/** The police zones from the police-zones snapshots under `root` */
export function buildPoliceZones(
    root: string,
    municipalityIds: readonly string[],
): { zones: PoliceZone[]; problems: string[] } {
    const snapshots = new Snapshots(root, 'police-zones')
    const entry = snapshots
        .entries()
        .filter((e) => POLICE_ZONES_ZIP.test(e.url) && e.status === 200)
        .sort((a, b) => a.url.localeCompare(b.url))
        .at(-1)
    const path = entry && snapshots.path(entry.url)
    if (!entry || !path) throw new Error('No snapshot of the police zones (FOD Financiën)')
    const files = execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' }).split('\n')
    const table = (name: RegExp) => {
        const file = files.find((f) => name.test(f))
        if (!file) throw new Error(`police zones: no ${String(name)} in ${entry.url}`)
        return readDbf(execFileSync('unzip', ['-p', path, file], { maxBuffer: 1 << 26 }))
    }
    return toPoliceZones(
        {
            zones: table(/(^|\/)Apn_PoZo\.dbf$/i),
            municipalities: table(/(^|\/)Tbl_AdMu_PoZo\.dbf$/i),
        },
        municipalityIds,
        { url: entry.url, retrieved: entry.retrieved },
    )
}
