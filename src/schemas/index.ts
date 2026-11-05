/**
 * Zod schemas for every record in data/, the source of the package's types and of the JSON
 * Schemas in schema/. Use them to validate a copy of the data, or data built on it.
 */
import { z } from 'zod'
import { arrondissementBoundarySchema } from './arrondissement-boundaries.ts'
import { cantonBoundarySchema } from './canton-boundaries.ts'
import { courtLocationSchema } from './court-locations.ts'
import {
    arrondissementSchema,
    cantonSchema,
    judicialAreaSchema,
    municipalitySchema,
    provinceSchema,
    regionSchema,
} from './territory.ts'
import { courtSchema } from './courts.ts'
import { houseOfJusticeSchema, prisonSchema } from './places.ts'
import { postalCodeSchema } from './postal-codes.ts'
import { policeZoneSchema } from './police-zones.ts'
import { interestRateSeriesSchema } from './interest-rates.ts'
import { publicHolidaysSchema } from './public-holidays.ts'
import { proceduralIndemnitiesSchema } from './procedural-indemnities.ts'

export * from '../ids.generated.ts'
export * from './common.ts'
export * from './territory.ts'
export * from './geometry.ts'
export * from './canton-boundaries.ts'
export * from './arrondissement-boundaries.ts'
export * from './courts.ts'
export * from './court-locations.ts'
export * from './places.ts'
export * from './postal-codes.ts'
export * from './police-zones.ts'
export * from './interest-rates.ts'
export * from './public-holidays.ts'
export * from './procedural-indemnities.ts'

/** The schema of each file in data/, by file name */
export const dataFileSchemas = {
    'judicial-areas': z.array(judicialAreaSchema),
    arrondissements: z.array(arrondissementSchema),
    cantons: z.array(cantonSchema),
    'canton-boundaries': z.array(cantonBoundarySchema),
    'arrondissement-boundaries': z.array(arrondissementBoundarySchema),
    regions: z.array(regionSchema),
    provinces: z.array(provinceSchema),
    municipalities: z.array(municipalitySchema),
    courts: z.array(courtSchema),
    'court-locations': z.array(courtLocationSchema),
    prisons: z.array(prisonSchema),
    'houses-of-justice': z.array(houseOfJusticeSchema),
    'postal-codes': z.array(postalCodeSchema),
    'police-zones': z.array(policeZoneSchema),
    'interest-rates': z.strictObject({
        legal: interestRateSeriesSchema,
        commercial: interestRateSeriesSchema,
    }),
    'public-holidays': publicHolidaysSchema,
    'procedural-indemnities': proceduralIndemnitiesSchema,
}
