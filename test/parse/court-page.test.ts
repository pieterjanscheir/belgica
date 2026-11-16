import { describe, expect, it } from 'vitest'

import { readCourtPage } from '../../scripts/parse/court-page.ts'

const home = '<html><head><title>Vredegerecht Test | Hoven &amp; Rechtbanken</title></head></html>'
/** A contact page with one contact block holding the given phone items */
const contactPage = (...phones: string[]) => `<html><body><main>
    <div class="paragraph paragraph--type--contact">
        ${phones.map((p) => `<div class="paragraph paragraph--type--phone"><ul><li>${p}</li></ul></div>`).join('')}
    </div></main></body></html>`
const read = (...phones: string[]) =>
    readCourtPage(
        'https://www.tribunaux-rechtbanken.be/nl/vredegerecht-test',
        home,
        contactPage(...phones),
    )

describe('readCourtPage contacts', () => {
    it('reads two numbers joined by a dash or a word as two numbers', () => {
        expect(read('02 508 65 11 - 02 508 65 12').contacts.map((c) => c.value)).toEqual([
            '+3225086511',
            '+3225086512',
        ])
        expect(read('09 234 42 15 / 09 234 42 01').contacts).toHaveLength(2)
    })

    it('keeps the text around a number as its note, without the joining word', () => {
        expect(
            read('09 234 42 15 en 09 234 42 01 (secretariaat eerste voorzitter)').contacts,
        ).toEqual([
            { type: 'phone', value: '+3292344215', note: 'secretariaat eerste voorzitter' },
            { type: 'phone', value: '+3292344201', note: 'secretariaat eerste voorzitter' },
        ])
        expect(read('+32 2 682 05 28 druk 1').contacts[0]?.note).toBe('druk 1')
    })

    it('keeps a slash inside a number', () => {
        expect(read('02/682.07.86.').contacts.map((c) => c.value)).toEqual(['+3226820786'])
    })

    it('reports what it cannot read', () => {
        const page = read('+32 682 05 28 druk 7')
        expect(page.contacts).toEqual([])
        expect(page.unreadable).toEqual(['phone: +32 682 05 28 druk 7'])
    })
})

/** A contact page whose contact tab holds the given markup */
const readTab = (tab: string) =>
    readCourtPage(
        'https://www.tribunaux-rechtbanken.be/nl/rechtbank-test',
        home,
        `<html><body><main><div class="tab-pane fade" id="list-contact"><h2>Contactgegevens</h2>
            ${tab}
        </div></main></body></html>`,
    )

describe('readCourtPage contacts written as text', () => {
    // The markup of the Ieper division of the court of first instance of West-Vlaanderen,
    // November 2026: one number to call, and per service its choice in the menu and its mailbox
    const menu = (intro: string) => `<div class="paragraph paragraph--type--text"><div>
        ${intro}
        <p>&nbsp;</p>
        <p><strong>Kies 1 - Burgerlijke en familierechtbank</strong></p>
        <ul>
            <li>Voor vragen over onder meer echtscheiding en burgerlijke procedures&nbsp;</li>
            <li><a href="mailto:WVL.REA.IEP.burgerlijk.familie@just.fgov.be">WVL.REA.IEP.burgerlijk.familie@just.fgov.be</a>&nbsp;</li>
        </ul>
        <p><strong>Kies 3 - Correctionele rechtbank</strong></p>
        <ul>
            <li>Voor vragen over strafzaken.</li>
            <li><a href="mailto:WVL.REA.IEP.correctioneel@just.fgov.be">WVL.REA.IEP.correctioneel@just.fgov.be</a>&nbsp;</li>
        </ul>
        <p><strong>Kies 3 - Overtuigingsstukken</strong></p>
        <ul>
            <li>in beslag genomen goederen</li>
            <li><a href="mailto:WVL.REA.IEP.overtuigingsstukken@just.fgov.be">WVL.REA.IEP.overtuigingsstukken@just.fgov.be</a>&nbsp;</li>
        </ul>
        <p><em>Weet u niet zeker bij welke dienst u moet zijn? Bel gerust naar het algemeen nummer, kies 1.</em></p>
    </div></div>`
    const expected = [
        { type: 'phone', value: '+3226820504' },
        {
            type: 'phone',
            value: '+3226820504',
            label: 'Burgerlijke en familierechtbank',
            note: 'Kies 1',
        },
        {
            type: 'email',
            value: 'wvl.rea.iep.burgerlijk.familie@just.fgov.be',
            label: 'Burgerlijke en familierechtbank',
        },
        { type: 'phone', value: '+3226820504', label: 'Correctionele rechtbank', note: 'Kies 3' },
        {
            type: 'email',
            value: 'wvl.rea.iep.correctioneel@just.fgov.be',
            label: 'Correctionele rechtbank',
        },
        { type: 'phone', value: '+3226820504', label: 'Overtuigingsstukken', note: 'Kies 3' },
        {
            type: 'email',
            value: 'wvl.rea.iep.overtuigingsstukken@just.fgov.be',
            label: 'Overtuigingsstukken',
        },
    ]

    it('reads a phone menu: the number, and each service with its choice and its mailbox', () => {
        const page = readTab(
            menu(
                '<h5>Bel naar <strong>02 682 05 04 </strong>en kies de juiste optie in het keuzemenu.</h5>',
            ),
        )
        expect(page.contacts).toEqual(expected)
        expect(page.unreadable).toEqual([])
    })

    it('reads the same menu when the line with the number is bold as a whole', () => {
        // The Kortrijk division's page
        const page = readTab(
            menu(
                '<h5><strong>Bel naar 02 682 05 04 en kies de juiste optie in het keuzemenu.</strong></h5>',
            ),
        )
        expect(page.contacts).toEqual(expected)
    })

    it('keeps the mailbox a page shows when the link behind it goes elsewhere, and says so', () => {
        // The Veurne division's page: its own mailboxes, over links copied from Ieper's page
        const page = readTab(`<div class="paragraph paragraph--type--text"><div>
            <h5>Bel naar <strong>02 682 17 14 </strong>en kies de juiste optie in het keuzemenu.</h5>
            <p><strong>Kies 2 - Jeugdrechtbank</strong></p>
            <ul>
                <li>Voor vragen over jeugdbescherming.</li>
                <li><a href="mailto:WVL.REA.IEP.jeugd@just.fgov.be">WVL.REA.VEU.jeugd@just.fgov.be</a>&nbsp;</li>
            </ul>
        </div></div>`)
        expect(page.contacts).toEqual([
            { type: 'phone', value: '+3226821714' },
            { type: 'phone', value: '+3226821714', label: 'Jeugdrechtbank', note: 'Kies 2' },
            { type: 'email', value: 'wvl.rea.veu.jeugd@just.fgov.be', label: 'Jeugdrechtbank' },
        ])
        expect(page.unreadable).toEqual([
            'email: 1 of 1 mailboxes are shown over a link to another address; the address shown is kept',
        ])
    })

    it('reports mailboxes in a text it cannot read, and does not guess', () => {
        const page = readTab(`<div class="paragraph paragraph--type--text"><div>
            <h3>Secretariaat Voorzitter:</h3>
            <p>02/682 01 58</p>
            <p><a href="mailto:orb.test.secretariaat@just.fgov.be">orb.test.secretariaat@just.fgov.be</a></p>
            <h3>Klachtenbehandeling:</h3>
            <p><a href="mailto:orb.test.klachten@just.fgov.be">orb.test.klachten@just.fgov.be</a></p>
        </div></div>`)
        expect(page.contacts).toEqual([])
        expect(page.unreadable).toEqual([
            'contact: 2 e-mail addresses written as text were not read',
        ])
    })

    it('says nothing about a text without contacts beside typed contact items', () => {
        const page = readTab(`<div class="paragraph paragraph--type--contact">
                <div class="paragraph paragraph--type--phone"><ul><li>02 508 65 11</li></ul></div>
            </div>
            <div class="paragraph paragraph--type--text"><div><p>Op afspraak.</p></div></div>`)
        expect(page.contacts).toEqual([{ type: 'phone', value: '+3225086511' }])
        expect(page.unreadable).toEqual([])
    })
})
