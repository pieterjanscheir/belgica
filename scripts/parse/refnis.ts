/**
 * Regions and provinces, from Statbel's REFNIS code list.
 *
 * Statbel's open-data page "REFNIS code" publishes TU_COM_REFNIS-<date>.zip: one pipe-separated
 * text file (windows-1252) with every code Statbel has assigned, at four levels: 1 regions,
 * 2 provinces, 3 administrative arrondissements, 4 municipalities. Each row has the names in
 * Dutch, French and German, the code of the unit above it (a province's region) and the period
 * the row applies (31/12/9999 is open-ended). The register is also the source of each record's
 * validity: a province that ended (Brabant, 20000, on 31 December 1994) stays listed with its end
 * date, so nothing is inferred from when a walk stopped seeing it.
 *
 * Only rows that still apply on the first day the territory data covers are written; the
 * history before that is https://github.com/pieterjanscheir/belgica/issues/27. Reading
 * the zip needs the `unzip` command, as scripts/build-cantons.ts does.
 */
import { execFileSync } from 'node:child_process'

import type { Translated } from '../../src/common.ts'
import { Snapshots } from '../sources/store.ts'
import type { Province, Region } from './types.ts'

export type { Province, Region } from './types.ts'

/** The file on Statbel's page, by its reference date */
const REFNIS_ZIP = /TU_COM_REFNIS-(\d{8})\.zip$/

/**
 * The first day the territory data describes: `territoryCoverage.from` in src/territory.ts,
 * repeated here because importing that module would load the data it builds (a test checks
 * the two agree).
 */
export const COVERAGE_FROM = '2025-01-01'

export interface RefnisRow {
    /** 1 region, 2 province, 3 administrative arrondissement, 4 municipality */
    level: number
    code: string
    /** The code of the unit above it; a region, or a province before 1995, has none */
    parent: string | undefined
    name: Translated
    /** First day the row applies, YYYY-MM-DD */
    from: string
    /** Last day the row applies, YYYY-MM-DD; none: open-ended */
    to: string | undefined
}

/**
 * Windows-1252 as a string. Node's `TextDecoder('windows-1252')` leaves bytes 0x80–0x9F as C1
 * control characters, and the file writes its apostrophes as 0x92 ("Province d’Anvers"), so
 * that range is mapped by hand (WHATWG Encoding, index windows-1252).
 */
export function decodeWindows1252(bytes: Uint8Array): string {
    const high = [
        0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039,
        0x152, 0x8d, 0x17d, 0x8f, 0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
        0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
    ]
    return Buffer.from(bytes)
        .toString('latin1')
        .replace(/[\u0080-\u009f]/g, (c) => String.fromCodePoint(high[c.charCodeAt(0) - 0x80] ?? 0))
}

/** A value the source must have; fails loudly instead of writing `undefined` into the data */
function must<T>(value: T | undefined, what: string): T {
    if (value === undefined) throw new Error(`REFNIS: missing ${what}`)
    return value
}

/** Statbel's DD/MM/YYYY as YYYY-MM-DD; the open end 31/12/9999 becomes undefined */
export function toDay(date: string): string | undefined {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date)
    if (!m) throw new Error(`REFNIS: unexpected date '${date}'`)
    const [, d, mo, y] = m
    return y === '9999' ? undefined : `${y ?? ''}-${mo ?? ''}-${d ?? ''}`
}

const COLUMNS = [
    'LVL_REFNIS',
    'CD_REFNIS',
    'CD_SUP_REFNIS',
    'TX_REFNIS_NL',
    'TX_REFNIS_FR',
    'TX_REFNIS_DE',
    'DT_VLDT_START',
    'DT_VLDT_END',
] as const

/** The rows of the REFNIS list, from its decoded text */
export function parseRefnis(text: string): RefnisRow[] {
    const [header = '', ...lines] = text.replace(/^\uFEFF/, '').split(/\r?\n/)
    const names = header.split('|')
    const columns = Object.fromEntries(
        COLUMNS.map((name) => {
            const index = names.indexOf(name)
            if (index === -1) throw new Error(`REFNIS: no column ${name} in header '${header}'`)
            return [name, index]
        }),
    ) as Record<(typeof COLUMNS)[number], number>
    const rows: RefnisRow[] = []
    for (const line of lines) {
        if (!line) continue
        const fields = line.split('|')
        const field = (name: keyof typeof columns) =>
            must(fields[columns[name]], `${name} in '${line}'`)
        const parent = field('CD_SUP_REFNIS')
        rows.push({
            level: Number(field('LVL_REFNIS')),
            code: field('CD_REFNIS'),
            parent: parent === '-' ? undefined : parent,
            name: {
                nl: field('TX_REFNIS_NL'),
                fr: field('TX_REFNIS_FR'),
                de: field('TX_REFNIS_DE'),
            },
            from: must(toDay(field('DT_VLDT_START')), 'start'),
            to: toDay(field('DT_VLDT_END')),
        })
    }
    return rows
}

interface Source {
    url: string
    retrieved: string
}

/**
 * The regions (level 1) and provinces (level 2) that apply on or after `coverageFrom`, as
 * records: validity from the register, left out where it says no more than the coverage does.
 */
export function toRecords(
    rows: readonly RefnisRow[],
    source: Source,
    coverageFrom = COVERAGE_FROM,
): { regions: Region[]; provinces: Province[] } {
    const current = rows.filter((row) => row.to === undefined || row.to >= coverageFrom)
    const validity = (row: RefnisRow) => ({
        ...(row.from > coverageFrom ? { validFrom: row.from } : {}),
        ...(row.to !== undefined ? { validTo: row.to } : {}),
    })
    const regions = current
        .filter((row) => row.level === 1)
        .map((row) => ({ id: row.code, ...validity(row), name: row.name, sources: [source] }))
    const regionIds = new Set(regions.map((r) => r.id))
    const provinces = current
        .filter((row) => row.level === 2)
        .map((row) => {
            const region = must(row.parent, `region of province ${row.code}`)
            if (!regionIds.has(region))
                throw new Error(`REFNIS: province ${row.code} is in unknown region ${region}`)
            return { id: row.code, ...validity(row), name: row.name, region, sources: [source] }
        })
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
    return { regions: regions.sort(byId), provinces: provinces.sort(byId) }
}

/** Regions and provinces from the statbel snapshots under `root` */
export function buildRegionsAndProvinces(root: string): {
    regions: Region[]
    provinces: Province[]
} {
    const snapshots = new Snapshots(root, 'statbel')
    const entry = snapshots
        .entries()
        .filter((e) => REFNIS_ZIP.test(e.url) && e.status === 200)
        .sort((a, b) => a.url.localeCompare(b.url))
        .at(-1)
    const path = entry && snapshots.path(entry.url)
    if (!entry || !path) throw new Error('No snapshot of the REFNIS code list (TU_COM_REFNIS)')
    const text = decodeWindows1252(execFileSync('unzip', ['-p', path], { maxBuffer: 1 << 26 }))
    return toRecords(parseRefnis(text), { url: entry.url, retrieved: entry.retrieved })
}
