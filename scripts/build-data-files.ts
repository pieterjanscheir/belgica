/**
 * Splits data/courts.json and data/cantons.json into the smaller files a browser app can load
 * on their own. Those two stay the complete files and the source of truth; everything written
 * here is generated from them, never edited by hand, and not committed (the package ships it).
 *
 *     data/courts/<type>.json                           one court type, all of Belgium
 *     data/courts/<type>/<arrondissement>.json          one type, one arrondissement
 *     data/courts/<type>/judicial-area/<area>.json      one type, its courts without an arrondissement
 *     data/courts/details/<id>.json                     one court's contacts, hours, website, sources
 *     data/courts/index.json                            each court id → its file under data/courts/
 *     data/cantons/summaries.json                       every canton without its territory text
 *     data/cantons/territory.json                       every canton's territory text
 *
 * The list files hold court summaries (see `CourtSummary`); every court is in exactly one
 * <type>/… file, the building blocks. A court whose area covers several arrondissements (a court
 * of appeal, a labour court, …) has no arrondissement: it goes in the file of its judicial area,
 * in a folder of its own so an area and an arrondissement with the same id ('antwerpen') don't
 * share a file. A details file holds one entry per version of the court, like the records.
 *
 * Also writes src/data-files.generated.ts and src/court-details-files.generated.ts: one `import()`
 * per file, for `belgica/courts/load`. The details have a module of their own, which the loader
 * imports only when details are asked for: its map of 347 imports is most of the loader's size.
 * Every path written here is public API: renaming or removing one is a major version.
 *
 * Run with `pnpm build:data-files` (part of `pnpm generate` and `pnpm build`).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { assertId } from './id.ts'
import type { Canton } from '../src/schemas/territory.ts'
import type { Court, CourtDetails, CourtSummary } from '../src/schemas/courts.ts'

const courts = JSON.parse(readFileSync('data/courts.json', 'utf8')) as Court[]
const cantons = JSON.parse(readFileSync('data/cantons.json', 'utf8')) as Canton[]

const SUMMARY: readonly (keyof CourtSummary)[] = [
    'id',
    'validFrom',
    'validTo',
    'type',
    'kind',
    'court',
    'name',
    'label',
    'canton',
    'cantons',
    'municipalities',
    'arrondissement',
    'judicialArea',
    'address',
]
const DETAILS: readonly (keyof CourtDetails)[] = [
    'id',
    'validFrom',
    'validTo',
    'ecli',
    'contacts',
    'openingHours',
    'openingHoursText',
    'website',
    'sources',
]

/** The fields of a record in `keys`, in the record's own order */
const pick = (record: object, keys: readonly string[]) =>
    Object.fromEntries(Object.entries(record).filter(([key]) => keys.includes(key)))

/** A court's building-block file, under data/courts/ and without .json */
const blockOf = (court: Pick<Court, 'type' | 'arrondissement' | 'judicialArea'>) =>
    court.arrondissement === undefined ?
        `${assertId(court.type, 'court type')}/judicial-area/${assertId(court.judicialArea, 'judicial area')}`
    :   `${assertId(court.type, 'court type')}/${assertId(court.arrondissement, 'arrondissement')}`

const files = new Map<string, unknown>()
const add = (file: string, record: unknown) => {
    const list = (files.get(file) ?? []) as unknown[]
    list.push(record)
    files.set(file, list)
}

const index: Record<string, string> = {}
for (const court of courts) {
    // The id names a file and is written into src/: nothing but an id gets through
    assertId(court.id, 'court id')
    const block = blockOf(court)
    // All versions of a court share its file, so an id leads to one file
    if (index[court.id] !== undefined && index[court.id] !== block)
        throw new Error(`The versions of ${court.id} are in ${index[court.id]} and ${block}`)
    index[court.id] = block
    const summary = pick(court, SUMMARY)
    add(`courts/${court.type}`, summary)
    add(`courts/${block}`, summary)
    add(`courts/details/${court.id}`, pick(court, DETAILS))
}
files.set('courts/index', index)
files.set(
    'cantons/summaries',
    cantons.map((canton) =>
        pick(
            canton,
            Object.keys(canton).filter((key) => key !== 'territory'),
        ),
    ),
)
files.set(
    'cantons/territory',
    cantons.map((canton) => pick(canton, ['id', 'validFrom', 'validTo', 'territory'])),
)

rmSync('data/courts', { recursive: true, force: true })
rmSync('data/cantons', { recursive: true, force: true })
for (const [file, data] of files) {
    const path = `data/${file}.json`
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(data) + '\n')
}

// One import() per file, written out: every bundler makes a chunk of a literal import(), while
// a template literal works only in some
const loader = (file: string) => `() => import('../data/${file}.json', { with: { type: 'json' } })`
const entries = (prefix: string, keys: string[]) =>
    keys.map((key) => `    '${key}': ${loader(prefix + key)},\n`).join('')
const lists = [...files.keys()]
    .filter(
        (f) => f.startsWith('courts/') && !f.startsWith('courts/details/') && f !== 'courts/index',
    )
    .map((f) => f.slice('courts/'.length))
    .sort()
const ids = Object.keys(index).sort()

const header = `// Generated by scripts/build-data-files.ts from data/courts.json. Do not edit.
// One import() per file, so a bundler makes a chunk of each and a browser downloads only the
// files asked for. The build keeps them out of dist: they load from data/.

type Load = () => Promise<{ default: unknown }>
`
writeFileSync(
    'src/data-files.generated.ts',
    `${header}
/** Each court list file, by its path under data/courts/ without .json */
export const courtListFiles: Readonly<Record<string, Load>> = {
${entries('courts/', lists)}}

/** data/courts/index.json */
export const courtIndexFile: Load = ${loader('courts/index')}
`,
)
writeFileSync(
    'src/court-details-files.generated.ts',
    `${header}
/** Each court's details file, by court id */
export const courtDetailsFiles: Readonly<Record<string, Load>> = {
${entries('courts/details/', ids)}}
`,
)
console.log(`${files.size} files in data/courts/ and data/cantons/`)
