import { describe, expect, it } from 'vitest'

import { isPersonalEmail, withoutPeople, withoutPersonName } from '../../scripts/parse/people.ts'
import type { Contact } from '../../scripts/parse/types.ts'

describe('isPersonalEmail', () => {
    it("finds an address shaped like a person's name", () => {
        expect(isPersonalEmail('jan.janssens@just.fgov.be')).toBe(true)
        expect(isPersonalEmail('j.dupont@just.fgov.be')).toBe(true)
        expect(isPersonalEmail('anne-marie.de-smet@just.fgov.be')).toBe(true)
    })

    it('keeps an address that names a place or a service', () => {
        for (const email of [
            'griffie.dinant@just.fgov.be',
            'vred.stniklaas@just.fgov.be',
            'jeunesse.namur@just.fgov.be',
            'justitiehuis.tongeren@vlaanderen.be',
            'pac.namur@just.fgov.be',
        ])
            expect(isPersonalEmail(email), email).toBe(false)
    })

    it('keeps an address in another shape', () => {
        for (const email of [
            'info@just.fgov.be',
            'vred.gent1@just.fgov.be',
            'f.g@just.fgov.be',
            'liege.ca.greffecivil@just.fgov.be',
        ])
            expect(isPersonalEmail(email), email).toBe(false)
    })

    it("doesn't take a first name for a place: Pierre is a word of Sint-Pieters-Woluwe's French name", () => {
        expect(isPersonalEmail('pierre.dupont@just.fgov.be')).toBe(true)
        expect(isPersonalEmail('herve.dupont@just.fgov.be')).toBe(true)
    })
})

describe('withoutPersonName', () => {
    it('takes a name out of a label and keeps the service', () => {
        expect(withoutPersonName('Jan Janssens - secretariaat')).toBe('secretariaat')
        expect(withoutPersonName('Griffie - Ann Van den Broeck')).toBe('Griffie')
        expect(withoutPersonName('Mme Dupont')).toBeUndefined()
    })

    it('leaves a label that names a service, a role or a place', () => {
        for (const label of [
            'Greffe de la Famille',
            'Chambre du Conseil',
            'Secretariaat Voorzitter',
            'Greffier - Secrétaire du Président',
            'Pro Deo',
            'Afdeling Gent',
            'Justice de Paix de Fosses-la-Ville',
            'Burgerlijke griffie - UNIT A (kamers 1N – 1F – 5N -5F)',
        ])
            expect(withoutPersonName(label), label).toBe(label)
    })
})

describe('withoutPeople', () => {
    const ignore = (): void => undefined
    const contacts: Contact[] = [
        {
            type: 'phone',
            value: '+3292344215',
            label: 'Jan Janssens - secretariaat',
            note: 'druk 1',
        },
        { type: 'email', value: 'jan.janssens@just.fgov.be', label: 'Secretariaat' },
        { type: 'email', value: 'griffie.gent@just.fgov.be' },
    ]

    it("leaves out a person's address and name, and keeps the rest as it was", () => {
        expect(withoutPeople(contacts, ignore)).toEqual([
            { type: 'phone', value: '+3292344215', label: 'secretariaat', note: 'druk 1' },
            { type: 'email', value: 'griffie.gent@just.fgov.be' },
        ])
        // The keys keep their order, so a rebuild doesn't rewrite every record
        expect(Object.keys(withoutPeople(contacts, ignore)[0] ?? {})).toEqual([
            'type',
            'value',
            'label',
            'note',
        ])
    })

    it('reports what it left out without repeating it', () => {
        const lines: string[] = []
        withoutPeople(contacts, (line) => lines.push(line))
        expect(lines).toHaveLength(2)
        expect(lines.join(' ')).not.toMatch(/janssens/i)
    })
})
