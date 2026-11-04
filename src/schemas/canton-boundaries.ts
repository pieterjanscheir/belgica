import { z } from 'zod'
import { cantonIdSchema } from '../ids.generated.ts'
import { sourceRefSchema, validityShape } from './common.ts'
import { multiPolygonSchema, ngiIdSchema } from './geometry.ts'

export {
    multiPolygonSchema,
    polygonCoordinatesSchema,
    positionSchema,
    ringSchema,
    type MultiPolygon,
    type PolygonCoordinates,
    type Position,
    type Ring,
} from './geometry.ts'

/**
 * The boundary of a judicial canton, as the National Geographic Institute (NGI) digitised it
 * from the annex to the Judicial Code. The legal text in the canton's `territory` is the law;
 * where the two disagree, the text wins.
 */
export const cantonBoundarySchema = z.strictObject({
    ...validityShape,
    /** The canton's id: a canton has one boundary, which takes its key */
    id: cantonIdSchema,
    /** The canton the boundary belongs to */
    canton: cantonIdSchema,
    /** The NGI's identifier of the object (its `tgid`), e.g. '{50412818-C0B7-4FEE-9E9B-DFFF0A768922}' */
    ngiId: ngiIdSchema,
    /**
     * The canton code in the NGI's data, in Dutch and French: six digits, the same in both
     * ('248112' for Gent 1), with an 'N' or 'F' prefix per language in Brussels-Capital and in
     * Sint-Genesius-Rode ('N238104', 'F238104' for Brussel 1)
     */
    cantonCode: z.strictObject({
        nl: z.string().regex(/^N?\d{6}$/),
        fr: z.string().regex(/^F?\d{6}$/),
    }),
    /**
     * The boundary as the NGI publishes it, without simplification: WGS 84, longitude first,
     * coordinates rounded to 7 decimals (about a centimetre). Where a law moved an area the NGI
     * hasn't redrawn yet, the area is moved, and `sources` cites the law.
     */
    geometry: multiPolygonSchema,
    sources: z.array(sourceRefSchema).min(1),
})
/**
 * The boundary of a judicial canton, as the National Geographic Institute (NGI) digitised it
 * from the annex to the Judicial Code. The legal text in the canton's `territory` is the law;
 * where the two disagree, the text wins.
 */
export type CantonBoundary = z.infer<typeof cantonBoundarySchema>
