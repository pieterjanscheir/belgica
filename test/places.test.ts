import { readFileSync } from 'node:fs'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { ID_PATTERN } from '../scripts/id'
import { localLanguage, prisonId } from '../scripts/parse/places'
import {
    getContact,
    getHouseOfJustice,
    getPrison,
    housesOfJustice,
    prisons,
    territoryCoverage,
    type HouseOfJustice,
    type Prison,
} from '../src'

const unique = (ids: string[]) => new Set(ids).size === ids.length

describe('prisons', () => {
    it('lists the 39 prisons and detention houses', () => {
        expect(prisons).toHaveLength(39)
        expect(prisons.filter((p) => p.kind === 'detention-house').map((p) => p.id)).toEqual([
            'detentiehuis-kortrijk',
            'detentiehuis-olen',
            'detentiehuis-vorst',
        ])
    })

    it('takes ids from the local-language name, without articles, unless pinned', () => {
        expect(unique(prisons.map((p) => p.id))).toBe(true)
        for (const p of prisons) {
            expect(p.id).toMatch(ID_PATTERN)
            const local = p.name[localLanguage(p.address.postalCode)]
            expect(p.id, p.id).toBe(prisonId(p.website.nl ?? '', local ?? ''))
        }
        expect(getPrison('prison-lantin').name).toMatchObject({ nl: 'Gevangenis van Lantin' })
        expect(getPrison('gevangenis-sint-gillis').name.fr).toBe('Prison de Saint-Gilles')
    })

    it('keeps the id of a renamed prison', () => {
        const page =
            'https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen/gevangenissen/adres_gevangenis_antwerpen_0'
        expect(prisonId(page, 'Gevangenis Antwerpen De Vest')).toBe('gevangenis-antwerpen')
        expect(prisonId(page.replace('antwerpen_0', 'gent'), 'Gevangenis van Gent')).toBe(
            'gevangenis-gent',
        )
    })

    it('names every prison in the three languages', () => {
        for (const p of prisons)
            expect(Object.keys(p.name).sort(), p.id).toEqual(['de', 'fr', 'nl'])
    })

    it('has a phone number for nearly every prison', () => {
        // The auxiliary prison of Dendermonde publishes none
        expect(prisons.filter((p) => !getContact(p, 'phone')).map((p) => p.id)).toEqual([
            'hulpgevangenis-dendermonde',
        ])
    })

    it('types lookups by id', () => {
        expectTypeOf(getPrison('gevangenis-gent')).toEqualTypeOf<Prison>()
        expectTypeOf(getPrison('x' as string)).toEqualTypeOf<Prison | undefined>()
        expect(getPrison('no-such-prison')).toBeUndefined()
    })
})

describe('houses of justice', () => {
    it('lists the Flemish and French-speaking houses', () => {
        const count = (community: string) =>
            housesOfJustice.filter((h) => h.community === community).length
        expect(count('flemish')).toBe(14)
        expect(count('french')).toBe(13)
    })

    it('has unique ids, and an OVO number for every Flemish house', () => {
        expect(unique(housesOfJustice.map((h) => h.id))).toBe(true)
        for (const h of housesOfJustice) {
            expect(h.id).toMatch(ID_PATTERN)
            if (h.community === 'flemish') expect(h.ovo, h.id).toMatch(/^OVO\d{6}$/)
            expect(getContact(h, 'email'), h.id).toMatch(/@(vlaanderen|cfwb)\.be$/)
        }
    })

    it('labels the victims service contacts', () => {
        expect(
            getContact(
                getHouseOfJustice('maison-justice-arlon'),
                'email',
                "service d'accueil des victimes",
            ),
        ).toBe('accueildesvictimes.arlon@cfwb.be')
    })

    it('types lookups by id', () => {
        expectTypeOf(getHouseOfJustice('justitiehuis-gent')).toEqualTypeOf<HouseOfJustice>()
        expect(getHouseOfJustice('no-such-house')).toBeUndefined()
    })
})

describe('localLanguage', () => {
    it.each([
        ['1000', 'nl'],
        ['1400', 'fr'],
        ['3000', 'nl'],
        ['4000', 'fr'],
        ['4700', 'de'],
        ['7500', 'fr'],
        ['9000', 'nl'],
    ])('%s → %s', (postalCode, lang) => {
        expect(localLanguage(postalCode)).toBe(lang)
    })
})

describe('territory coverage', () => {
    it('matches datapackage.json', () => {
        const { resources } = JSON.parse(readFileSync('datapackage.json', 'utf8')) as {
            resources: { name: string; temporalCoverage?: { start: string } }[]
        }
        for (const name of ['judicial-areas', 'arrondissements', 'cantons', 'municipalities'])
            expect(resources.find((r) => r.name === name)?.temporalCoverage?.start, name).toBe(
                territoryCoverage.from,
            )
    })
})
