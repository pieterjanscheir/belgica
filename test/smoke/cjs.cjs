// CommonJS consumers: same checks as esm.mjs
const assert = require('node:assert/strict')
const { getCourt } = require('belgica')
const { getCantonsForMunicipality } = require('belgica/territory')
const { getJusticeOfThePeace } = require('belgica/courts')
const { getInterestRate } = require('belgica/interest-rates')
const { getProceduralIndemnity } = require('belgica/procedural-indemnities')
const { nextWorkingDay } = require('belgica/calendar')
const { getPostalCodes } = require('belgica/postal-codes')
const { findCantonsAt } = require('belgica/canton-boundaries')
const { findArrondissementsAt } = require('belgica/arrondissement-boundaries')
const { formatCourtName } = require('belgica/courts/format')
const { loadCourtDetails } = require('belgica/courts/load')
const { getCanton } = require('belgica/cantons')
const { getCantonTerritory } = require('belgica/cantons/territory')

assert.equal(getCourt('justice-of-the-peace-gent-1').name.nl, 'Vredegerecht Gent 1')
assert.equal(getJusticeOfThePeace('gent-1').id, 'justice-of-the-peace-gent-1')
assert.equal(getProceduralIndemnity(null, '2025-03-01').base, 1883.72)
assert.deepEqual(
    getCantonsForMunicipality('44088').map((c) => c.id),
    ['merelbeke-melle'],
)
assert.equal(getInterestRate('2024-06-15', 'legal').rate, 5.75)
assert.equal(nextWorkingDay('2026-04-04'), '2026-04-07')
assert.equal(
    getPostalCodes('44021').some((p) => p.postalCode === '9000'),
    true,
)
assert.deepEqual(
    findCantonsAt(3.745, 50.995).map((c) => c.id),
    ['merelbeke-melle'],
)
assert.deepEqual(
    findArrondissementsAt(3.745, 50.995).map((a) => a.id),
    ['oost-vlaanderen'],
)

assert.equal(
    formatCourtName(getJusticeOfThePeace('gent-1'), 'de', { style: 'canton' }),
    'Friedensgericht 1. Kanton Gent',
)
assert.equal(getCanton('gent-1').territory, undefined)
assert.equal(typeof getCantonTerritory('gent-1').fr, 'string')

loadCourtDetails('justice-of-the-peace-gent-1').then((details) => {
    assert.equal(details.id, 'justice-of-the-peace-gent-1')
    console.log(`CJS smoke test passed on Node ${process.version}`)
})
