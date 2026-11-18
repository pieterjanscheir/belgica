import { describe, expect, it } from 'vitest'

import * as root from '../src'
import { findCantonsAt } from '../src/canton-boundaries'
import { courtLocations, courtLocationsCoverage, getCourtLocation } from '../src/court-locations'
import { NGI_CANTONS } from '../scripts/sources/catalog'
import { appliesOn, courts, getCourt } from '../src'
import { today as todayInBelgium } from '../src/time'

const today = todayInBelgium()
const current = courtLocations.filter((l) => appliesOn(l, today))

describe('court locations', () => {
    it('places most justices of the peace, and only courts that exist today', () => {
        expect(current.length).toBeGreaterThan(120)
        for (const l of current) {
            expect(l.court, l.id).toBe(l.id)
            const court = getCourt(l.court)
            expect(court.type, l.id).toBe('justice-of-the-peace')
            expect(appliesOn(court, today), l.id).toBe(true)
        }
    })

    it('is a GeoJSON point in Belgium, to 7 decimals, from the NGI file', () => {
        for (const l of courtLocations) {
            const [lon, lat] = l.geometry.coordinates
            expect(lon, l.id).toBeGreaterThan(2.5)
            expect(lon, l.id).toBeLessThan(6.5)
            expect(lat, l.id).toBeGreaterThan(49.4)
            expect(lat, l.id).toBeLessThan(51.6)
            expect(lon, l.id).toBe(Number(lon.toFixed(7)))
            expect(l.sources.map((s) => s.url)).toEqual([NGI_CANTONS])
        }
    })

    // A court can sit outside its canton (the Antwerp cantons share a building), but never far:
    // a point in another arrondissement would be a point for the wrong court
    it('lies in the arrondissement of its court', () => {
        for (const l of current) {
            const [lon, lat] = l.geometry.coordinates
            const arrondissements = findCantonsAt(lon, lat).map((c) => c.arrondissement)
            expect(arrondissements, l.id).toContain(getCourt(l.court).arrondissement)
        }
    })

    it('is only in its own entry point, not the package root', () => {
        expect('courtLocations' in root).toBe(false)
        expect('getCourtLocation' in root).toBe(false)
    })
})

describe('getCourtLocation', () => {
    it('finds the location of a court, by court id', () => {
        expect(getCourtLocation('justice-of-the-peace-aalst-1')?.geometry.type).toBe('Point')
        expect(
            getCourtLocation('justice-of-the-peace-aalst-1', { on: courtLocationsCoverage.from })
                ?.id,
        ).toBe('justice-of-the-peace-aalst-1')
        // The NGI has no point for the courts of first instance
        expect(courts.some((c) => c.id === 'court-of-first-instance-antwerpen')).toBe(true)
        expect(getCourtLocation('court-of-first-instance-antwerpen')).toBeUndefined()
        expect(() =>
            getCourtLocation('justice-of-the-peace-aalst-1', { on: '2026-01-01' }),
        ).toThrow(RangeError)
    })
})
