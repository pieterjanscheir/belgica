/**
 * The procedural indemnity (rechtsplegingsvergoeding, indemnité de procédure): the fixed
 * contribution to the lawyer's fees of the party that wins (art. 1022 Judicial Code), by the
 * tariffs of the KB of 26 October 2007 and their indexations. The judge sets the amount between
 * the minimum and the maximum; these functions give the three, not the judge's choice.
 */
import proceduralIndemnitiesData from '../data/procedural-indemnities.json'
import type {
    ProceduralIndemnities,
    ProceduralIndemnityAmounts,
    ProceduralIndemnityIndexation,
    ProceduralIndemnityTariff,
    ProceduralIndemnityTariffId,
} from './schemas/procedural-indemnities'
import { toDay } from './time'

export type {
    ProceduralIndemnities,
    ProceduralIndemnityAmounts,
    ProceduralIndemnityBracket,
    ProceduralIndemnityIndexation,
    ProceduralIndemnityTariff,
    ProceduralIndemnityTariffId,
} from './schemas/procedural-indemnities'

// The data is validated against the zod schemas in ./schemas (test/schema.test.ts)
/** The tariffs as the KB sets them, not indexed, and every indexation since 2008 */
export const proceduralIndemnities = proceduralIndemnitiesData as Readonly<ProceduralIndemnities>

const tariffsById = new Map(proceduralIndemnities.tariffs.map((t) => [t.id, t]))

/** A tariff by its id, with the amounts as the KB sets them (not indexed) */
export function getProceduralIndemnityTariff(
    id: ProceduralIndemnityTariffId,
): ProceduralIndemnityTariff
/** A tariff by its id, with the amounts as the KB sets them (not indexed); `undefined` for an unknown id */
export function getProceduralIndemnityTariff(id: string): ProceduralIndemnityTariff | undefined
export function getProceduralIndemnityTariff(id: string): ProceduralIndemnityTariff | undefined {
    return tariffsById.get(id as ProceduralIndemnityTariffId)
}

/**
 * The indexation in force on a day, usually the day of the judgment, or `null` before the KB
 * came into force on 1 January 2008.
 *
 * Throws a `RangeError` for a string that isn't a valid YYYY-MM-DD day, or an invalid `Date`.
 */
export function getProceduralIndemnityIndexation(
    date: Date | string,
): ProceduralIndemnityIndexation | null {
    const day = toDay(date)
    // Sorted oldest first (test/procedural-indemnities.test.ts): the last that has started
    return proceduralIndemnities.indexations.findLast((i) => i.from <= day) ?? null
}

/**
 * An amount of the KB, indexed: multiplied by the indexation's multiplier, or by its index
 * divided by the start index (105.78), and rounded to the cent (art. 8). Computed in whole
 * cents, so 0.5 cent always rounds up and no floating-point error creeps in.
 */
export function indexProceduralIndemnity(
    amount: number,
    indexation: ProceduralIndemnityIndexation,
): number {
    const [numerator, denominator] =
        indexation.method === 'steps' ?
            [Math.round(indexation.multiplier * 1000), 1000]
        :   [Math.round(indexation.index * 100), Math.round(proceduralIndemnities.startIndex * 100)]
    const cents = Math.round(amount * 100)
    return Math.floor((2 * cents * numerator + denominator) / (2 * denominator)) / 100
}

const indexAmounts = (
    amounts: ProceduralIndemnityAmounts,
    indexation: ProceduralIndemnityIndexation,
): ProceduralIndemnityAmounts => ({
    min: indexProceduralIndemnity(amounts.min, indexation),
    base: indexProceduralIndemnity(amounts.base, indexation),
    max: indexProceduralIndemnity(amounts.max, indexation),
})

/** A bracket of an indexed table: the values of the claim it covers and its amounts */
export interface ProceduralIndemnityTableBracket extends ProceduralIndemnityAmounts {
    /** The bracket covers claims above this value in euro; `null` for the first, from 0 */
    above: number | null
    /** Highest value of the claim in the bracket in euro, inclusive; `null` for the last */
    upTo: number | null
}

/** A tariff with its amounts indexed for a day */
export interface ProceduralIndemnityTable {
    tariff: ProceduralIndemnityTariffId
    indexation: ProceduralIndemnityIndexation
    /** By the value of the claim, lowest first */
    brackets: ProceduralIndemnityTableBracket[]
    /** For a claim that can't be valued in money */
    nonMonetary: ProceduralIndemnityAmounts
}

/**
 * Every bracket of a tariff, indexed for a day (usually the day of the judgment), or `null`
 * before 1 January 2008. The general tariff by default.
 *
 * Throws a `RangeError` for an invalid day or an unknown tariff.
 */
export function getProceduralIndemnityTable(
    date: Date | string,
    options: { tariff?: ProceduralIndemnityTariffId } = {},
): ProceduralIndemnityTable | null {
    const tariff = tariffOf(options.tariff)
    const indexation = getProceduralIndemnityIndexation(date)
    if (!indexation) return null
    return {
        tariff: tariff.id,
        indexation,
        brackets: tariff.brackets.map((bracket, i) => ({
            above: tariff.brackets[i - 1]?.upTo ?? null,
            upTo: bracket.upTo,
            ...indexAmounts(bracket, indexation),
        })),
        nonMonetary: indexAmounts(tariff.nonMonetary, indexation),
    }
}

/** The procedural indemnity for a claim on a day */
export interface ProceduralIndemnityResult extends ProceduralIndemnityAmounts {
    tariff: ProceduralIndemnityTariffId
    /** The bracket of the claim; `null` for a claim that can't be valued in money */
    bracket: { above: number | null; upTo: number | null } | null
    indexation: ProceduralIndemnityIndexation
}

/**
 * The minimum, base and maximum procedural indemnity for a claim of `claim` euro, or for a claim
 * that can't be valued in money when `claim` is `null`, on a day (usually the day of the
 * judgment). The general tariff by default. `null` before 1 January 2008.
 *
 * For a claim that is only partly valued in money, ask for both and compare: which applies is
 * for the judge to decide.
 *
 * Throws a `RangeError` for a claim that is negative or not a finite number, an invalid day or
 * an unknown tariff.
 */
export function getProceduralIndemnity(
    claim: number | null,
    date: Date | string,
    options: { tariff?: ProceduralIndemnityTariffId } = {},
): ProceduralIndemnityResult | null {
    if (claim !== null && !(Number.isFinite(claim) && claim >= 0)) {
        throw new RangeError(`Expected the value of the claim in euro, got ${claim}`)
    }
    const table = getProceduralIndemnityTable(date, options)
    if (!table) return null
    const { tariff, indexation } = table
    if (claim === null) return { tariff, bracket: null, indexation, ...table.nonMonetary }
    const bracket = table.brackets.find((b) => b.upTo === null || claim <= b.upTo)
    // The last bracket has no upper limit (test/procedural-indemnities.test.ts), so one matches
    /* v8 ignore start */
    if (!bracket) throw new Error(`No bracket for ${claim} in the ${tariff} tariff`)
    /* v8 ignore stop */
    const { above, upTo, min, base, max } = bracket
    return { tariff, bracket: { above, upTo }, indexation, min, base, max }
}

function tariffOf(id: ProceduralIndemnityTariffId = 'general'): ProceduralIndemnityTariff {
    const tariff = tariffsById.get(id)
    if (!tariff) throw new RangeError(`Unknown procedural indemnity tariff '${id}'`)
    return tariff
}
