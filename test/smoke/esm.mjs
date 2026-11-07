// Imports the built package by name, as a consumer would. Plain Node, no test runner, so CI
// can run it on every supported Node version.
import assert from 'node:assert/strict'
import { getCourt, getCanton, cantons as allCantons } from 'belgica'
import { cantons, getCantonsForMunicipality } from 'belgica/territory'
import { formatCourtName, getJusticeOfThePeace } from 'belgica/courts'
import { getInterestRate } from 'belgica/interest-rates'
import { getProceduralIndemnity } from 'belgica/procedural-indemnities'
import { getPublicHolidays, nextWorkingDay } from 'belgica/calendar'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
import { findCourtsForPostalCode, getMunicipality } from 'belgica'
import { findCantonsAt, getCantonBoundary } from 'belgica/canton-boundaries'
import { findArrondissementsAt } from 'belgica/arrondissement-boundaries'
import { getCourtLocation } from 'belgica/court-locations'
import { courtIdSchema, dataFileSchemas } from 'belgica/schemas'
import { createRequire } from 'node:module'
import { formatCourtName as formatWithoutData } from 'belgica/courts/format'
import { loadCourt, loadCourtDetails, loadCourts } from 'belgica/courts/load'
import { getCanton as getCantonSummary } from 'belgica/cantons'
import { getCantonTerritory } from 'belgica/cantons/territory'
import east from 'belgica/data/courts/justice-of-the-peace/oost-vlaanderen.json' with { type: 'json' }
import { statSync } from 'node:fs'

assert.equal(getCourt('justice-of-the-peace-gent-1').name.nl, 'Vredegerecht Gent 1')
assert.equal(getProceduralIndemnity(10_000, '2025-03-01').base, 1412.79)
assert.equal(getJusticeOfThePeace('gent-1').id, 'justice-of-the-peace-gent-1')
assert.equal(
    formatCourtName(getJusticeOfThePeace('gent-1'), 'fr', { style: 'canton' }),
    'Justice de paix 1er canton Gand',
)
assert.deepEqual(
    getCantonsForMunicipality('44088').map((c) => c.id),
    ['merelbeke-melle'],
)
assert.equal(getInterestRate('2024-06-15', 'legal').rate, 5.75)
assert.equal(nextWorkingDay('2026-04-04'), '2026-04-07')
assert.equal(getPublicHolidays(2026).length, 10)
assert.equal(getPrison('gevangenis-gent').address.postalCode, '9000')
assert.equal(getHouseOfJustice('justitiehuis-gent').ovo, 'OVO001917')
assert.equal(getMunicipalitiesForPostalCode('9000')[0], getMunicipality('44021'))
assert.equal(findCourtsForPostalCode('1040', 'police-court').length, 2)
assert.equal(dataFileSchemas.cantons.safeParse(cantons).success, true)
assert.equal(courtIdSchema.safeParse('justice-of-the-peace-gent-1').success, true)
assert.equal(getCantonBoundary('gent-1').geometry.type, 'MultiPolygon')
assert.deepEqual(
    findCantonsAt(3.745, 50.995).map((c) => c.id),
    ['merelbeke-melle'],
)
assert.deepEqual(
    findArrondissementsAt(3.745, 50.995).map((a) => a.id),
    ['oost-vlaanderen'],
)
assert.equal(getCourtLocation('justice-of-the-peace-aalst-1').geometry.type, 'Point')
// The entry points share one copy of the data
assert.equal(cantons, allCantons)

// The split data files: static, loaded on demand, and the cantons without their territory
assert.equal(
    formatWithoutData(
        east.find((c) => c.canton === 'gent-1'),
        'nl',
        { style: 'canton' },
    ),
    'Vredegerecht 1e kanton Gent',
)
assert.equal(
    (await loadCourts({ type: 'justice-of-the-peace', arrondissement: 'oost-vlaanderen' })).length,
    east.length,
)
assert.equal((await loadCourt('court-of-appeal-gent')).judicialArea, 'gent')
assert.equal((await loadCourtDetails('justice-of-the-peace-gent-1')).contacts.length > 0, true)
assert.equal(getCantonSummary('gent-1').territory, undefined)
assert.equal(getCantonTerritory('gent-1').nl, getCanton('gent-1').territory.nl)

const require = createRequire(import.meta.url)
assert.equal(require('belgica/data/courts.json').length > 0, true)
assert.equal(require('belgica/datapackage.json').name, 'belgica')
assert.equal(require('belgica/schema/courts.schema.json').title, 'belgica: data/courts.json')

// The boundaries are read from data/, not inlined: the package holds them once (#80)
for (const dataset of ['canton', 'arrondissement']) {
    const entry = new URL(import.meta.resolve(`belgica/${dataset}-boundaries`))
    assert.ok(statSync(entry).size < 100_000, `dist/ inlines the ${dataset} boundaries`)
}

console.log(`ESM smoke test passed on Node ${process.version}`)
