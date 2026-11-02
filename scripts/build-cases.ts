/**
 * Writes the answers of the built helpers (dist/) for every municipality, postal code, canton
 * and court, a grid of points and a run of days, as JSON: the cases another language's port is
 * tested against, so it gives the same answers as this package. `pnpm build:cases [file]`; the
 * Python tests read python/tests/.cases/parity.json. Not committed: the answers follow the data,
 * which changes twice a week.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type * as Root from '../src/index.ts'
import type * as ArrondissementBoundaries from '../src/arrondissement-boundaries.ts'
import type * as Boundaries from '../src/canton-boundaries.ts'
import type * as CourtLocations from '../src/court-locations.ts'
import type * as Courts from '../src/courts.ts'
import type * as Houses from '../src/houses-of-justice.ts'
import type * as Postal from '../src/postal-codes.ts'
import type * as PoliceZones from '../src/police-zones.ts'
import type * as Prisons from '../src/prisons.ts'
import type * as Territory from '../src/territory.ts'

// The built package (pnpm build first), typed from src/: Node can't load src/ itself, which
// imports JSON without import attributes, and typecheck runs before the build
const load = <T>(entry: string) => import(`../dist/${entry}.js`) as Promise<T>
const {
    cantons,
    courts,
    findCourtsWithJurisdiction,
    findCourts,
    findCourtsForPostalCode,
    findJusticesOfThePeace,
    formatCourtName,
    formatPhoneNumber,
    getArrondissementForMunicipality,
    getCantonsForMunicipality,
    getCourtsForCanton,
    getDivisions,
    getInterestRate,
    getLatestKnownRateDate,
    getMunicipalitiesForPostalCode,
    getPostalCodes,
    getProvinceForMunicipality,
    getRegionForMunicipality,
    housesOfJustice,
    municipalities,
    postalCodes,
    prisons,
    toDay,
} = await load<typeof Root>('index')
const { cantonBoundaries, cantonBoundariesCoverage, findCantonsAt } =
    await load<typeof Boundaries>('canton-boundaries')
const { arrondissementBoundaries, arrondissementBoundariesCoverage, findArrondissementsAt } =
    await load<typeof ArrondissementBoundaries>('arrondissement-boundaries')
const { courtLocationsCoverage, getCourtLocation } =
    await load<typeof CourtLocations>('court-locations')
const { courtsCoverage } = await load<typeof Courts>('courts')
const { housesOfJusticeCoverage } = await load<typeof Houses>('houses-of-justice')
const { postalCodesCoverage } = await load<typeof Postal>('postal-codes')
const { findPoliceZone, policeZonesCoverage } = await load<typeof PoliceZones>('police-zones')
const { prisonsCoverage } = await load<typeof Prisons>('prisons')
const { territoryCoverage } = await load<typeof Territory>('territory')
type CourtType = Root.CourtType

const out = process.argv[2] ?? 'python/tests/.cases/parity.json'
const today = toDay(new Date())
// The first day of the coverage and today: the territory changes on neither, but a port that
// ignores the day would pass a single-day test
const days = [territoryCoverage.from, today]
const types: CourtType[] = [
    'justice-of-the-peace',
    'police-court',
    'court-of-first-instance',
    'enterprise-court',
    'labour-court',
    'court-of-appeal',
    'labour-court-of-appeal',
    'court-of-assize',
]
const ids = (records: readonly { id: string }[]) => records.map((r) => r.id)

const municipalityIds = [...new Set(municipalities.map((m) => m.id)), '00000']
const postalCodeValues = [...new Set(postalCodes.map((p) => p.postalCode)), '0000']
// The police zones start later than the territory: today only
const policeZoneCases = municipalityIds.map((municipality) => ({
    municipality,
    zone: findPoliceZone(municipality, { on: today })?.id ?? null,
}))
const cantonIds = [...new Set(cantons.map((c) => c.id)), 'nowhere']
const courtIds = [...new Set(courts.map((c) => c.id))]

const municipalityCases = days.flatMap((on) =>
    municipalityIds.map((id) => ({
        id,
        on,
        cantons: ids(getCantonsForMunicipality(id, { on })),
        arrondissement: getArrondissementForMunicipality(id, { on })?.id ?? null,
        province: getProvinceForMunicipality(id, { on })?.id ?? null,
        region: getRegionForMunicipality(id, { on })?.id ?? null,
        postalCodes: ids(getPostalCodes(id, { on })),
        justicesOfThePeace: findJusticesOfThePeace(id, { on }).map((c) => ({
            canton: c.canton.id,
            court: c.court.id,
            partial: c.partial,
        })),
        competentCourts: Object.fromEntries(
            types.map((type) => [type, ids(findCourtsWithJurisdiction(id, type, { on }))]),
        ),
    })),
)

const postalCodeCases = postalCodeValues.map((postalCode) => ({
    postalCode,
    on: today,
    municipalities: ids(getMunicipalitiesForPostalCode(postalCode, { on: today })),
    courts: findCourtsForPostalCode(postalCode, 'police-court', { on: today }).map((entry) => ({
        municipality: entry.municipality.id,
        justicesOfThePeace: entry.justicesOfThePeace.map((c) => c.court.id),
        courts: ids(entry.courts),
    })),
}))

const cantonCases = cantonIds.map((id) => ({
    id,
    on: today,
    courts: ids(getCourtsForCanton(id, { on: today })),
}))

const courtCases = courtIds.map((id) => {
    const court = courts.findLast((c) => c.id === id)
    if (!court) throw new Error(id)
    return {
        id,
        divisions: ids(getDivisions(id, { on: today })),
        names: Object.fromEntries(
            (['nl', 'fr', 'de'] as const).flatMap((locale) => [
                [`${locale}/official`, formatCourtName(court, locale)],
                [`${locale}/canton`, formatCourtName(court, locale, { style: 'canton' })],
            ]),
        ),
    }
})

const filterCases = [
    {},
    ...types.map((type) => ({ type })),
    { kind: 'division' as const },
    { kind: 'seat' as const },
    { type: 'enterprise-court' as const, arrondissement: 'west-vlaanderen' },
    { judicialArea: 'liege' },
    { type: 'police-court' as const, kind: 'court' as const, judicialArea: 'brussel' },
].map((filter) => ({ filter, on: today, courts: ids(findCourts(filter, { on: today })) }))

// The first of every month since 1970, both types, both contract dates
const rateCases: unknown[] = []
for (let year = 1969; year <= Number(today.slice(0, 4)) + 1; year++) {
    for (let month = 1; month <= 12; month++) {
        for (const day of [1, 15]) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            for (const type of ['legal', 'commercial'] as const) {
                for (const contractAfter20130316 of [false, true]) {
                    rateCases.push({
                        date,
                        type,
                        contractAfter20130316,
                        result: getInterestRate(date, type, { contractAfter20130316 }),
                    })
                }
            }
        }
    }
}

const phones = [
    ...new Set(
        [...courts, ...prisons, ...housesOfJustice].flatMap((r) =>
            r.contacts.filter((c) => c.type === 'phone' || c.type === 'fax').map((c) => c.value),
        ),
    ),
]

// A grid over Belgium, about 5 km apart: points well inside cantons, and some outside the country
const pointCases: unknown[] = []
for (let lat = 49.45; lat <= 51.55; lat += 0.05) {
    for (let lon = 2.5; lon <= 6.45; lon += 0.08) {
        const [x, y] = [Number(lon.toFixed(4)), Number(lat.toFixed(4))]
        pointCases.push({
            longitude: x,
            latitude: y,
            on: today,
            cantons: ids(findCantonsAt(x, y, { on: today })),
            arrondissements: ids(findArrondissementsAt(x, y, { on: today })),
        })
    }
}
// A vertex of each boundary: on the line between cantons, where both count
for (const boundary of cantonBoundaries) {
    const [x, y] = boundary.geometry.coordinates[0]?.[0]?.[0] ?? []
    if (x === undefined || y === undefined) continue
    pointCases.push({
        longitude: x,
        latitude: y,
        on: today,
        cantons: ids(findCantonsAt(x, y, { on: today })),
        arrondissements: ids(findArrondissementsAt(x, y, { on: today })),
    })
}
// And of each arrondissement's boundary
for (const boundary of arrondissementBoundaries) {
    const [x, y] = boundary.geometry.coordinates[0]?.[0]?.[0] ?? []
    if (x === undefined || y === undefined) continue
    pointCases.push({
        longitude: x,
        latitude: y,
        on: today,
        cantons: ids(findCantonsAt(x, y, { on: today })),
        arrondissements: ids(findArrondissementsAt(x, y, { on: today })),
    })
}

// Every court, with or without a point
const locationCases = courtIds.map((id) => ({
    id,
    on: today,
    location: getCourtLocation(id, { on: today }) ?? null,
}))

mkdirSync(dirname(out), { recursive: true })
writeFileSync(
    out,
    JSON.stringify({
        today,
        coverage: {
            territory: territoryCoverage.from,
            courts: courtsCoverage.from,
            postalCodes: postalCodesCoverage.from,
            prisons: prisonsCoverage.from,
            housesOfJustice: housesOfJusticeCoverage.from,
            cantonBoundaries: cantonBoundariesCoverage.from,
            arrondissementBoundaries: arrondissementBoundariesCoverage.from,
            courtLocations: courtLocationsCoverage.from,
            policeZones: policeZonesCoverage.from,
        },
        municipalities: municipalityCases,
        postalCodes: postalCodeCases,
        policeZones: policeZoneCases,
        cantons: cantonCases,
        courts: courtCases,
        findCourts: filterCases,
        interestRates: rateCases,
        latestKnownRateDate: {
            legal: getLatestKnownRateDate('legal'),
            commercial: getLatestKnownRateDate('commercial'),
        },
        phoneNumbers: phones.map((e164) => ({ e164, national: formatPhoneNumber(e164) })),
        points: pointCases,
        courtLocations: locationCases,
    }),
)
console.log(`Wrote ${out}`)
