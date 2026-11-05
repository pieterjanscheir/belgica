/**
 * The consumer price index, from the snapshot of Statbel's bestat view, and the indexations of
 * the procedural indemnity it sets off (art. 8 of the KB of 26 October 2007).
 *
 * The view's columns aren't fixed: the month can be one label ('februari 2025', '2025-02',
 * '202502') or a month next to a year, in any of the national languages or English, and the
 * index a number or a string with a decimal comma. The reading follows the parser rpv-calculator.be
 * has used on the same view since 2024.
 *
 * An indexation is due when the index of a month is 10 points or more above or below the last
 * indexation's threshold, on the ladder of 10 points from 105.78. It takes effect on the first day
 * of the next month, with that month's index as the new index (the formula of the KB of 16 May
 * 2024). The build adds it to data/procedural-indemnities.json; the data pull request says so.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { format, resolveConfig } from 'prettier'

import { STATBEL_CPI } from '../sources/catalog.ts'
import { Snapshots } from '../sources/store.ts'
import type {
    ProceduralIndemnities,
    ProceduralIndemnityIndexation,
} from '../../src/schemas/procedural-indemnities.ts'

/** An indexation by the formula of the KB of 16 May 2024: the only kind the index sets off now */
export type FormulaIndexation = Extract<ProceduralIndemnityIndexation, { method: 'formula' }>

/** One month of the index: YYYY-MM and its value */
export interface CpiMonth {
    month: string
    index: number
}

const MONTH_NAMES = new Map<string, number>()
for (const names of [
    'januari februari maart april mei juni juli augustus september oktober november december',
    'janvier fevrier mars avril mai juin juillet aout septembre octobre novembre decembre',
    'januar februar marz april mai juni juli august september oktober november dezember',
    'january february march april may june july august september october november december',
])
    names.split(' ').forEach((name, i) => MONTH_NAMES.set(name, i + 1))

/** Column names that are the consumer price index beyond doubt */
const INDEX_KEYS = [
    'consumptieprijsindex',
    'indicedesprixalaconsommation',
    'consumerpriceindex',
    'verbraucherpreisindex',
]
/** Column names taken for the index when none of the above is there */
const INDEX_FALLBACK_KEYS = ['cpi', 'index', 'indexcijfer', 'indexwaarde', 'indice', 'indexvalue']
/** Never the index: the health index, the inflation */
const NOT_INDEX_KEYS = ['gezondheid', 'sante', 'health', 'inflat']
const PERIOD_KEYS = ['maand', 'mois', 'month', 'monat', 'periode', 'period']
const YEAR_KEYS = ['jaar', 'annee', 'year', 'jahr']

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const key = (name: string) => plain(name).replace(/[^a-z0-9]/g, '')

function number(value: unknown): number | undefined {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
    if (typeof value !== 'string' || value.trim() === '') return undefined
    let text = value.trim()
    // '1.234,56' and '166,05': a comma is the decimal separator, dots group thousands
    if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.')
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : undefined
}

const month = (year: number, m: number) =>
    (
        Number.isInteger(year) &&
        year >= 1900 &&
        year < 2200 &&
        Number.isInteger(m) &&
        m >= 1 &&
        m <= 12
    ) ?
        `${year}-${String(m).padStart(2, '0')}`
    :   undefined

/** A month in one label: 'februari 2025', '2025 februari', '2025-02', '02/2025', '202502' */
function period(label: string): string | undefined {
    const text = plain(label.trim())
    const parts = text.split(/[\s,]+/).filter(Boolean)
    if (parts.length === 2) {
        for (const [name = '', year = ''] of [parts, [...parts].reverse()]) {
            const m = MONTH_NAMES.get(name)
            if (m !== undefined && /^\d{4}$/.test(year)) return month(Number(year), m)
        }
    }
    let match = /^(\d{4})[\s/m-](\d{1,2})(?:\D.*)?$/.exec(text)
    if (match) return month(Number(match[1]), Number(match[2]))
    match = /^(\d{1,2})[/-](\d{4})$/.exec(text)
    if (match) return month(Number(match[2]), Number(match[1]))
    match = /^(\d{4})(\d{2})$/.exec(text)
    if (match) return month(Number(match[1]), Number(match[2]))
    return undefined
}

function monthOf(fact: Record<string, unknown>): string | undefined {
    let year: number | undefined
    let m: number | undefined
    for (const [name, value] of Object.entries(fact)) {
        const k = key(name)
        if (PERIOD_KEYS.some((p) => k.includes(p))) {
            if (typeof value === 'string') {
                const found = period(value)
                if (found) return found
                m = MONTH_NAMES.get(plain(value.trim())) ?? m
            }
            const n = number(value)
            if (n !== undefined && Number.isInteger(n)) {
                if (n >= 1 && n <= 12) m = n
                const compact = month(Math.floor(n / 100), n % 100)
                if (compact) return compact
            }
        }
        if (YEAR_KEYS.includes(k)) {
            const n = number(value)
            if (n !== undefined && Number.isInteger(n)) year = n
        }
    }
    return year !== undefined && m !== undefined ? month(year, m) : undefined
}

function indexOf(fact: Record<string, unknown>): number | undefined {
    let fallback: number | undefined
    for (const [name, value] of Object.entries(fact)) {
        const k = key(name)
        if (NOT_INDEX_KEYS.some((n) => k.includes(n))) continue
        if (INDEX_KEYS.some((i) => k.includes(i))) {
            const n = number(value)
            if (n !== undefined) return n
        }
        if (fallback === undefined && INDEX_FALLBACK_KEYS.includes(k)) fallback = number(value)
    }
    return fallback
}

/**
 * The monthly index from a bestat view result (`{ facts: [...] }`), oldest first. Throws when it
 * isn't one, when no fact has a month and an index, or when a month has two different values.
 */
export function readCpiSeries(data: unknown): { series: CpiMonth[]; unreadable: number } {
    const facts = (data as { facts?: unknown } | null)?.facts
    if (!Array.isArray(facts)) throw new Error('cpi: the Statbel response has no facts')
    const byMonth = new Map<string, number>()
    let unreadable = 0
    for (const fact of facts) {
        const record =
            typeof fact === 'object' && fact !== null ? (fact as Record<string, unknown>) : {}
        const m = monthOf(record)
        const index = indexOf(record)
        if (m === undefined || index === undefined) {
            unreadable++
            continue
        }
        const seen = byMonth.get(m)
        if (seen !== undefined && Math.abs(seen - index) > 0.005)
            throw new Error(`cpi: ${m} has two values, ${seen} and ${index}`)
        byMonth.set(m, index)
    }
    if (facts.length > 0 && byMonth.size === 0) {
        const sample: object =
            (facts as unknown[]).find((f): f is object => typeof f === 'object' && f !== null) ?? {}
        throw new Error(
            `cpi: no month and index in the Statbel facts (fields: ${Object.keys(sample).join(', ')})`,
        )
    }
    const series = [...byMonth].map(([m, index]) => ({ month: m, index }))
    series.sort((a, b) => a.month.localeCompare(b.month))
    return { series, unreadable }
}

const round2 = (n: number) => Math.round(n * 100) / 100
/** The month before a day's month: '2025-03-01' → '2025-02' */
const monthBefore = (day: string) => {
    const [y = 0, m = 0] = day.split('-').map(Number)
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
/** The first day of the month after: '2025-02' → '2025-03-01' */
const firstOfNextMonth = (m: string) => {
    const [y = 0, mm = 0] = m.split('-').map(Number)
    return mm === 12 ? `${y + 1}-01-01` : `${y}-${String(mm + 1).padStart(2, '0')}-01`
}

/**
 * The series in base 2004, the base the KB uses. The last indexation by the formula is the anchor:
 * its index is that of the month before it took effect. When the series gives that month another
 * value, Statbel serves another base, and the series is scaled to the anchor (`rescaled`).
 * `problem` when the series doesn't have the anchor's month: then its base can't be checked.
 */
export function toBase2004(
    series: readonly CpiMonth[],
    indexations: readonly ProceduralIndemnityIndexation[],
): { series: CpiMonth[]; rescaled: boolean; problem?: string } {
    const anchor = indexations.findLast((i) => i.method === 'formula')
    if (!anchor) return { series: [...series], rescaled: false }
    const m = monthBefore(anchor.from)
    const value = series.find((s) => s.month === m)?.index
    if (value === undefined)
        return {
            series: [...series],
            rescaled: false,
            problem: `cpi: the Statbel series has no ${m}, the month of the indexation of ${anchor.from}, so its base can't be checked`,
        }
    if (Math.abs(value - anchor.index) < 0.005) return { series: [...series], rescaled: false }
    const factor = anchor.index / value
    return {
        series: series.map((s) => ({ month: s.month, index: round2(s.index * factor) })),
        rescaled: true,
    }
}

/** The ladder: 105.78 plus or minus a multiple of 10 */
const rung = (start: number, steps: number) => round2(start + 10 * steps)

/**
 * The indexations the index sets off after the last one on file, oldest first: each month from the
 * one after the last indexation's own month, in base 2004.
 */
export function dueIndexations(
    series: readonly CpiMonth[],
    data: Pick<ProceduralIndemnities, 'startIndex' | 'indexations'>,
): FormulaIndexation[] {
    const last = data.indexations.at(-1)
    if (!last) return []
    const start = data.startIndex
    const after = monthBefore(last.from)
    let threshold = last.threshold
    const due: FormulaIndexation[] = []
    for (const { month: m, index } of series) {
        if (m <= after) continue
        // A tiny tolerance: 175.78 is reached by 175.78, whatever the float makes of it
        const steps = (index - start) / 10
        let reached: number | undefined
        if (index >= round2(threshold + 10) - 1e-9) reached = rung(start, Math.floor(steps + 1e-9))
        else if (index <= round2(threshold - 10) + 1e-9)
            reached = rung(start, Math.ceil(steps - 1e-9))
        if (reached === undefined) continue
        due.push({
            from: firstOfNextMonth(m),
            method: 'formula',
            threshold: reached,
            index,
            note: `Het indexcijfer van ${m} (Statbel, basis 2004) bereikte ${String(reached).replace('.', ',')}`,
        })
        threshold = reached
    }
    return due
}

/** Where the index stands: the latest month, and the thresholds it is between */
export function cpiStatus(
    series: readonly CpiMonth[],
    data: Pick<ProceduralIndemnities, 'indexations'>,
): string | undefined {
    const latest = series.at(-1)
    const last = data.indexations.at(-1)
    if (!latest || !last) return undefined
    const up = round2(last.threshold + 10)
    const down = round2(last.threshold - 10)
    return `cpi: ${latest.month} is ${latest.index}; the next indexation comes at ${up} (or ${down} on the way down)`
}

/**
 * The indexations due by the snapshot of Statbel's index. `problems` stop the build: a response
 * that can't be read, or whose base can't be checked. `notes` go in the data pull request.
 */
export function buildIndexations(
    root: string,
    data: Pick<ProceduralIndemnities, 'startIndex' | 'indexations'>,
): { due: FormulaIndexation[]; problems: string[]; notes: string[] } {
    if (!existsSync(join(root, 'cpi', 'index.json')))
        return { due: [], problems: [], notes: ['cpi: no snapshot of the index yet'] }
    const text = new Snapshots(root, 'cpi').text(STATBEL_CPI)
    if (text === undefined)
        return { due: [], problems: [], notes: ['cpi: the last fetch of the index failed'] }
    let read: ReturnType<typeof readCpiSeries>
    try {
        read = readCpiSeries(JSON.parse(text))
    } catch (error) {
        return {
            due: [],
            problems: [String(error instanceof Error ? error.message : error)],
            notes: [],
        }
    }
    const based = toBase2004(read.series, data.indexations)
    if (based.problem) return { due: [], problems: [based.problem], notes: [] }
    const notes: string[] = []
    if (based.rescaled)
        notes.push('cpi: Statbel serves another base; the index was scaled to base 2004')
    if (read.unreadable > 0)
        notes.push(`cpi: ${read.unreadable} facts without a month and an index`)
    const status = cpiStatus(based.series, data)
    if (status) notes.push(status)
    return { due: dueIndexations(based.series, data), problems: [], notes }
}

/**
 * The data file's text with the indexations added at the end of `indexations`, its last key.
 * Inserted into the text and formatted as prettier formats the rest of this hand-built file, so
 * the diff is the new indexations and nothing else.
 */
export async function addIndexations(
    text: string,
    due: readonly ProceduralIndemnityIndexation[],
    file: string,
): Promise<string> {
    const end = text.lastIndexOf(']')
    const added = due.map((i) => JSON.stringify(i)).join(',')
    const updated = await format(`${text.slice(0, end).trimEnd()},${added}${text.slice(end)}`, {
        ...(await resolveConfig(file)),
        filepath: file,
    })
    const { indexations } = JSON.parse(updated) as ProceduralIndemnities
    if (JSON.stringify(indexations.slice(-due.length)) !== JSON.stringify(due))
        throw new Error(`${file}: the new indexations didn't land at the end of indexations`)
    return updated
}
