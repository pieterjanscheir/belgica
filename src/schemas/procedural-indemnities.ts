import { z } from 'zod'
import { daySchema, translatedSchema } from './common.ts'

/**
 * The tariffs of the KB of 26 October 2007: 'general' (art. 2 and 3, every court), and for the
 * proceedings of art. 579 and 1017, second paragraph, Judicial Code (occupational accidents and
 * diseases, social security) the three of art. 4: the president of the labour court, the labour
 * court and the labour court of appeal
 */
export const proceduralIndemnityTariffIdSchema = z.enum([
    'general',
    'labour-court-president',
    'labour-court',
    'labour-court-of-appeal',
])
/**
 * The tariffs of the KB of 26 October 2007: 'general' (art. 2 and 3, every court), and for the
 * proceedings of art. 579 and 1017, second paragraph, Judicial Code the three of art. 4
 */
export type ProceduralIndemnityTariffId = z.infer<typeof proceduralIndemnityTariffIdSchema>

const euroSchema = z.number().min(0)

/** The minimum, base and maximum amount in euro */
export const proceduralIndemnityAmountsSchema = z.strictObject({
    /** Minimum amount in euro */
    min: euroSchema,
    /** Base amount in euro: what the judge awards unless a party asks for more or less */
    base: euroSchema,
    /** Maximum amount in euro */
    max: euroSchema,
})
/** The minimum, base and maximum amount in euro */
export type ProceduralIndemnityAmounts = z.infer<typeof proceduralIndemnityAmountsSchema>

/** One bracket of a tariff, by the value of the claim, with its amounts as the KB sets them */
export const proceduralIndemnityBracketSchema = z.strictObject({
    /**
     * Highest value of the claim in the bracket in euro, inclusive; `null` for the last bracket.
     * The bracket starts just above the previous one's `upTo`, or at 0.
     */
    upTo: euroSchema.nullable(),
    ...proceduralIndemnityAmountsSchema.shape,
})
/** One bracket of a tariff, by the value of the claim, with its amounts as the KB sets them */
export type ProceduralIndemnityBracket = z.infer<typeof proceduralIndemnityBracketSchema>

/** One tariff: its brackets and the amounts for a claim that can't be valued in money */
export const proceduralIndemnityTariffSchema = z.strictObject({
    id: proceduralIndemnityTariffIdSchema,
    name: translatedSchema,
    /** The article of the KB that sets it */
    article: z.string(),
    /** By the value of the claim, lowest first; only the last has no `upTo` */
    brackets: z.array(proceduralIndemnityBracketSchema).min(1),
    /** For a claim that can't be valued in money */
    nonMonetary: proceduralIndemnityAmountsSchema,
})
/** One tariff: its brackets and the amounts for a claim that can't be valued in money */
export type ProceduralIndemnityTariff = z.infer<typeof proceduralIndemnityTariffSchema>

const indexShape = {
    /** First day the indexed amounts apply, YYYY-MM-DD; they apply until the next indexation */
    from: daySchema,
    /** The consumer price index (base 2004) that set off the indexation: 105.78 plus a multiple of 10 */
    threshold: z.number().positive(),
    note: z.string().exactOptional(),
}

/** An indexation of the amounts (art. 8 of the KB) */
export const proceduralIndemnityIndexationSchema = z.discriminatedUnion('method', [
    z.strictObject({
        /** Art. 8 before the KB of 16 May 2024: 10 % more or less for every 10 index points */
        method: z.literal('steps'),
        ...indexShape,
        /** What the amounts of the KB are multiplied by: 1, 1.1, 1.2, … */
        multiplier: z.number().positive(),
    }),
    z.strictObject({
        /**
         * Art. 8 as amended by the KB of 16 May 2024: the amount of the KB times the new index,
         * divided by the start index, rounded to the cent
         */
        method: z.literal('formula'),
        ...indexShape,
        /** The new index: the consumer price index (base 2004) of the month the threshold was reached */
        index: z.number().positive(),
    }),
])
/** An indexation of the amounts (art. 8 of the KB) */
export type ProceduralIndemnityIndexation = z.infer<typeof proceduralIndemnityIndexationSchema>

/** The procedural indemnities data file: the tariffs and every indexation */
export const proceduralIndemnitiesSchema = z.strictObject({
    description: z.string(),
    legalBasis: z.string(),
    /** The index the amounts of the KB are linked to: March 2007, base 2004 */
    startIndex: z.number().positive(),
    tariffs: z.array(proceduralIndemnityTariffSchema).min(1),
    /** Every indexation since the KB came into force, oldest first */
    indexations: z.array(proceduralIndemnityIndexationSchema).min(1),
})
/** The procedural indemnities data file: the tariffs and every indexation */
export type ProceduralIndemnities = z.infer<typeof proceduralIndemnitiesSchema>
