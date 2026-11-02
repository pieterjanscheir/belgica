import { z } from 'zod'
import { municipalityIdSchema, policeZoneIdSchema } from '../ids.generated.ts'
import { sourceRefSchema, translatedSchema, validityShape } from './common.ts'

/**
 * A police zone (politiezone, zone de police, Polizeizone): the local police of one or more
 * municipalities, as the royal decrees of 28 April 2000 set them, from FOD Financiën's open data
 */
export const policeZoneSchema = z.strictObject({
    ...validityShape,
    /** The zone's official number, e.g. '5415' for Gent: the code the federal police uses */
    id: policeZoneIdSchema,
    /**
     * The zone's official name per language: the municipalities it covers, in capitals, as the
     * source writes it, e.g. 'AARTSELAAR/EDEGEM/HOVE/KONTICH/LINT'
     */
    name: translatedSchema,
    /** The short name the zone goes by, in capitals, e.g. 'HESBAYE' or 'REGIO PUYENBROECK' */
    alias: z.string().min(1).exactOptional(),
    /** The municipalities it covers, by REFNIS code; every municipality is in exactly one zone */
    municipalities: z.array(municipalityIdSchema).min(1),
    sources: z.array(sourceRefSchema).min(1),
})
/**
 * A police zone (politiezone, zone de police, Polizeizone): the local police of one or more
 * municipalities, as the royal decrees of 28 April 2000 set them, from FOD Financiën's open data
 */
export type PoliceZone = z.infer<typeof policeZoneSchema>
