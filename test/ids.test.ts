// The identifier rules in docs/guide/identifiers.md, checked on every record
import { describe, expect, it } from 'vitest'

import { ID_PATTERN, toId } from '../scripts/id'
import { DATASETS, lockIds, readLock } from '../scripts/lock-ids'
import { arrondissementBoundaries } from '../src/arrondissement-boundaries'
import { cantonBoundaries } from '../src/canton-boundaries'
import { courtLocations } from '../src/court-locations'
import { policeZones } from '../src/police-zones'
import {
    arrondissements,
    cantons,
    courts,
    getArrondissement,
    getCanton,
    getCourt,
    housesOfJustice,
    judicialAreas,
    municipalities,
    postalCodes,
    prisons,
    provinces,
    regions,
} from '../src'

const names = (name: Record<string, string>) => Object.values(name)

// The language ids are taken from: French in Wallonia; otherwise the Dutch-text name, which is
// Dutch in Flanders and (tie-break) Brussels, and German around Eupen
const local = (arrondissement: string) =>
    ['brabant-wallon', 'liege', 'luxembourg', 'namur', 'hainaut'].includes(arrondissement) ? 'fr'
    :   'nl'

describe('identifiers', () => {
    const datasets = {
        judicialAreas,
        arrondissements,
        cantons,
        cantonBoundaries,
        regions,
        provinces,
        municipalities,
        courts,
        prisons,
        housesOfJustice,
        postalCodes,
    }

    // A record may have several versions (validFrom), never two with the same start
    it.each(Object.entries(datasets))('are unique in %s, per version', (_name, records) => {
        const keys = records.map((r) => `${r.id}|${(r as { validFrom?: string }).validFrom ?? ''}`)
        expect(new Set(keys).size).toBe(keys.length)
    })

    it('are lowercase kebab-case, or official codes for regions, provinces, municipalities and postal codes', () => {
        for (const records of [
            judicialAreas,
            arrondissements,
            cantons,
            courts,
            prisons,
            housesOfJustice,
        ]) {
            for (const { id } of records) expect(id).toMatch(ID_PATTERN)
        }
        for (const records of [regions, provinces, municipalities]) {
            for (const { id } of records) expect(id).toMatch(/^\d{5}$/)
        }
        // The postal code and the REFNIS code: neither alone names a record
        for (const p of postalCodes) expect(p.id).toBe(`${p.postalCode}-${p.municipality}`)
    })

    it('derive from one of the official names', () => {
        for (const records of [judicialAreas, arrondissements]) {
            for (const r of records)
                expect(
                    names(r.name).map((n) => toId(n)),
                    r.id,
                ).toContain(r.id)
        }
        for (const c of cantons) {
            expect(
                names(c.name).map((n) => toId(n, c.number)),
                c.id,
            ).toContain(c.id)
        }
    })

    it('use the local-language name', () => {
        for (const c of cantons)
            expect(c.id, c.id).toBe(toId(c.name[local(c.arrondissement)], c.number))
        expect(getArrondissement('oost-vlaanderen').name.nl).toBe('Oost-Vlaanderen')
        expect(getArrondissement('brabant-wallon').name.fr).toBe('Brabant wallon')
        expect(getCanton('eupen-sankt-vith-1').name.nl).toBe('Eupen-Sankt-Vith')
    })

    // Ids are public API: one that was published must stay, whatever the sources do. Removing
    // one is a major version, a changelog entry, and then its removal from ids.lock.json by hand.
    describe('once published, stay', () => {
        const lock = readLock()
        const current: Record<(typeof DATASETS)[number], readonly string[]> = {
            'judicial-areas': judicialAreas.map((r) => r.id),
            arrondissements: arrondissements.map((r) => r.id),
            cantons: cantons.map((r) => r.id),
            'canton-boundaries': cantonBoundaries.map((r) => r.id),
            'arrondissement-boundaries': arrondissementBoundaries.map((r) => r.id),
            regions: regions.map((r) => r.id),
            provinces: provinces.map((r) => r.id),
            municipalities: municipalities.map((r) => r.id),
            courts: courts.map((r) => r.id),
            'court-locations': courtLocations.map((r) => r.id),
            prisons: prisons.map((r) => r.id),
            'houses-of-justice': housesOfJustice.map((r) => r.id),
            'postal-codes': postalCodes.map((r) => r.id),
            'police-zones': policeZones.map((r) => r.id),
        }

        it.each(DATASETS)('%s has every id it published before', (dataset) => {
            const ids = new Set(current[dataset])
            const missing = lock[dataset].filter((id) => !ids.has(id))
            expect(
                missing,
                `${dataset}: these published ids are gone. If a source renamed a record, map it ` +
                    'to its id in the parser; if the record really ended, keep it with a validTo. ' +
                    'Only a major version removes an id: note it in CHANGELOG.md and ids.lock.json.',
            ).toEqual([])
        })

        it('has every current id in the lock (run pnpm generate)', () => {
            expect(lockIds(lock, current)).toEqual(lock)
        })
    })

    it('of courts are the court type followed by the place', () => {
        for (const c of courts) {
            expect(c.id, c.id).toMatch(ID_PATTERN)
            if (c.type === 'justice-of-the-peace' && c.kind === 'court')
                expect(c.id).toBe(`justice-of-the-peace-${c.canton ?? ''}`)
            else expect(c.id.startsWith(`${c.type}-`), c.id).toBe(true)
        }
        expect(getCourt('police-court-brussel-fr').name.fr).toBe(
            'Tribunal de police francophone de Bruxelles',
        )
        expect(getCourt('police-court-eupen-sankt-vith').name.de).toBe(
            'Polizeigericht Eupen, Abteilung Sankt Vith',
        )
    })
})
