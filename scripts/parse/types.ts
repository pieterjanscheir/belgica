/**
 * The published record types, for the parsers, with plain string ids: the parsers make the ids,
 * and the id unions in src/ids.generated.ts are generated from what they make.
 */
import type { Address as PublishedAddress } from '../../src/common.ts'
import type { ArrondissementBoundary as PublishedArrondissementBoundary } from '../../src/arrondissement-boundaries.ts'
import type {
    CantonBoundary as PublishedCantonBoundary,
    MultiPolygon,
} from '../../src/canton-boundaries.ts'
import type { CourtLocation as PublishedCourtLocation } from '../../src/court-locations.ts'
import type { Court as PublishedCourt } from '../../src/courts.ts'
import type { HouseOfJustice as PublishedHouseOfJustice } from '../../src/houses-of-justice.ts'
import type { PoliceZone as PublishedPoliceZone } from '../../src/police-zones.ts'
import type { PostalCode as PublishedPostalCode } from '../../src/postal-codes.ts'
import type { Prison as PublishedPrison } from '../../src/prisons.ts'
import type {
    Province as PublishedProvince,
    Region as PublishedRegion,
} from '../../src/territory.ts'

export type { Contact, ContactType, Locale } from '../../src/common.ts'
export type { CourtType } from '../../src/courts.ts'
export type { MultiPolygon }

export type Address = Omit<PublishedAddress, 'municipality'> & { municipality?: string }
export type Court = Omit<
    PublishedCourt,
    'id' | 'court' | 'judicialArea' | 'arrondissement' | 'canton' | 'cantons' | 'address'
> & {
    id: string
    court?: string
    judicialArea: string
    arrondissement?: string
    canton?: string
    cantons?: string[]
    address?: Address
}
export type Prison = Omit<PublishedPrison, 'id' | 'address'> & { id: string; address: Address }
export type HouseOfJustice = Omit<PublishedHouseOfJustice, 'id' | 'address'> & {
    id: string
    address: Address
}
export type PoliceZone = Omit<PublishedPoliceZone, 'id' | 'municipalities'> & {
    id: string
    municipalities: string[]
}
export type PostalCode = Omit<PublishedPostalCode, 'id' | 'municipality'> & {
    id: string
    municipality: string
}
export type CantonBoundary = Omit<PublishedCantonBoundary, 'id' | 'canton'> & {
    id: string
    canton: string
}
export type ArrondissementBoundary = Omit<
    PublishedArrondissementBoundary,
    'id' | 'arrondissement'
> & { id: string; arrondissement: string }
export type CourtLocation = Omit<PublishedCourtLocation, 'id' | 'court'> & {
    id: string
    court: string
}
export type Region = Omit<PublishedRegion, 'id'> & { id: string }
export type Province = Omit<PublishedProvince, 'id' | 'region'> & { id: string; region: string }
