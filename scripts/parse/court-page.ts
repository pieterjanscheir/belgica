/**
 * Reads one court's page and contact page on tribunaux-rechtbanken.be.
 *
 * The contact page is a Drupal page with typed "paragraphs": an address, contact blocks with
 * phone, fax, email and account-number items, and cards for each registry ("Greffe civil") or
 * secretariat holding their own contact blocks. A contact's label is the title of the card it
 * sits in; the text published with the value is kept as its note. A block's remark isn't used:
 * it may concern only one of the block's values.
 *
 * Some courts write their contacts as text instead: one number to call, then each service's
 * choice in the phone menu and its mailbox. That one shape is read; any other text that holds a
 * mailbox is reported and not guessed at.
 */
import { parse, type HTMLElement } from 'node-html-parser'

import { clean, toAddress, toE164, toEmail, toIban } from './normalize.ts'
import { withoutPeople } from './people.ts'
import type { Address, Contact, ContactType } from './types.ts'

export interface CourtPage {
    url: string
    lang: 'nl' | 'fr' | 'de'
    /** The page title without the site's name: 'Politierechtbank Limburg - afdeling Genk' */
    title: string
    address?: Address
    contacts: Contact[]
    /** Values the parser could not read, for the report */
    unreadable: string[]
    openingHoursText?: string
}

const SITE_SUFFIX =
    /\s*\|\s*(Hoven & Rechtbanken|Cours & Tribunaux|Gerichtshöfe & Gerichte|Gerichtshöfe und Gerichte)\s*$/

const text = (el: HTMLElement | null | undefined) => (el ? clean(el.textContent) : '')

const PHONE = /(?:\+|00)?\d[\d\s/.()-]{6,}\d/g
/** A dash or slash with spaces around it, between two numbers: "02 508 65 11 - 02 508 65 12" */
const BETWEEN_NUMBERS = /(\d)\s+[-–/]\s+(?=(?:\+|0)\d)/g
/** Words that only join two values: "09 234 42 15 en 09 234 42 01" */
const JOINING_WORD = /^(?:en|et|und|of|ou|oder)\b\s*/i

/**
 * The values in one published contact item, with the text around them as a note: "+32 2 682 05
 * 28 druk 1" is a phone number with the note "druk 1"
 */
function readContacts(
    item: HTMLElement,
    type: ContactType,
    card: string | undefined,
    unreadable: string[],
): Contact[] {
    const raw = text(item.querySelector('li') ?? item)
    if (!raw) return []
    let values: string[] = []
    let rest = raw
    if (type === 'email') {
        const hrefs = item
            .querySelectorAll('a[href^="mailto:"]')
            .map((a) => a.getAttribute('href') ?? '')
        values = (hrefs.length > 0 ? hrefs : (raw.match(/\S+@\S+/g) ?? [])).flatMap(
            (v) => toEmail(v) ?? [],
        )
        rest = raw.replace(/\S+@\S+/g, '')
    } else if (type === 'bank-account') {
        for (const match of raw.match(/BE[\d\s]{14,24}/gi) ?? []) {
            const iban = toIban(match)
            if (iban) {
                values.push(iban)
                rest = rest.replace(match, '')
            }
        }
    } else {
        for (const match of raw.replace(BETWEEN_NUMBERS, '$1 | ').match(PHONE) ?? []) {
            const phone = toE164(match.replace(/\(0\)/, ''))
            if (phone) {
                values.push(phone)
                rest = rest.replace(match, '')
            }
        }
    }
    if (values.length === 0) {
        unreadable.push(`${type}: ${raw}`)
        return []
    }
    const note = clean(
        rest
            .replace(/^[\s:;,./|–-]+|[\s:;,./|–-]+$/g, '')
            .replace(JOINING_WORD, '')
            .replace(/^\((.*)\)$/, '$1'),
    )
    return [...new Set(values)].map((value) => ({
        type,
        value,
        ...(card ? { label: card } : {}),
        ...(note ? { note } : {}),
    }))
}

const ITEM_TYPES: [string, ContactType][] = [
    ['phone', 'phone'],
    ['fax', 'fax'],
    ['email', 'email'],
    ['account-number', 'bank-account'],
]

/** The contacts in a contact block, labelled with the title of the card it sits in */
function readBlock(block: HTMLElement, card: string | undefined, unreadable: string[]): Contact[] {
    const out: Contact[] = []
    for (const item of block.querySelectorAll('.paragraph')) {
        const kind = /paragraph--type--([a-z-]+)/.exec(item.getAttribute('class') ?? '')?.[1]
        const type = ITEM_TYPES.find(([k]) => k === kind)?.[1]
        if (!type) continue
        out.push(...readContacts(item, type, card, unreadable))
    }
    return out
}

/** The phone numbers in a line of text */
const numbers = (raw: string) =>
    (raw.replace(BETWEEN_NUMBERS, '$1 | ').match(PHONE) ?? []).flatMap(
        (match) => toE164(match.replace(/\(0\)/, '')) ?? [],
    )

/** A line that is bold from start to end: a service's name over its list */
const isBold = (el: HTMLElement) =>
    text(el) !== '' &&
    text(el) ===
        clean(
            el
                .querySelectorAll('strong, b')
                .map((b) => b.textContent)
                .join(' '),
        )

/**
 * The mailbox of a link in a text: the address the page shows, and the link's own where it shows
 * a word. `differs` is set when the two aren't the same address: the Kortrijk and Veurne
 * divisions' pages show their own mailboxes over links copied from the Ieper division's page.
 */
function mailbox(a: HTMLElement): { value: string | undefined; differs: boolean } {
    const shown = toEmail(text(a))
    const linked = toEmail(a.getAttribute('href') ?? '')
    return { value: shown ?? linked, differs: !!shown && !!linked && shown !== linked }
}

/** The choice in a phone menu before a service's name: "Kies 1 - Jeugdrechtbank" */
const MENU_CHOICE = /^(.*\d)\s+[-–]\s+(.+)$/

/**
 * The contacts of a phone menu written as text: the number to call, then per service a bold
 * line ("Kies 1 - Burgerlijke en familierechtbank") over a list that holds its mailbox. Each
 * service gets the number with its choice as the note, and its mailbox. A text without such
 * services gives nothing.
 */
function readMenu(block: HTMLElement, unreadable: string[]): Contact[] {
    const lines = block
        .querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')
        .filter((el) => text(el) !== '' && !el.parentNode?.closest('ul, ol'))
    const isList = (el: HTMLElement | undefined) => el?.tagName === 'UL' || el?.tagName === 'OL'
    const phones: string[] = []
    const services: Contact[] = []
    /** The service the lines belong to: its name, when short enough for a label */
    let service: { label?: string } | undefined
    /** Mailboxes whose link goes to another address than the one shown */
    let elsewhere = 0
    lines.forEach((line, i) => {
        if (isList(line)) {
            if (!service) return
            for (const a of line.querySelectorAll('a[href^="mailto:"]')) {
                const { value, differs } = mailbox(a)
                if (!value) continue
                services.push({ type: 'email', value, ...service })
                if (differs) elsewhere++
            }
        } else if (isBold(line) && isList(lines[i + 1])) {
            const choice = MENU_CHOICE.exec(text(line))
            const name = choice?.[2] ?? text(line)
            service = name.length <= 80 ? { label: name } : {}
            for (const value of phones)
                services.push({
                    type: 'phone',
                    value,
                    ...service,
                    ...(choice?.[1] ? { note: choice[1] } : {}),
                })
        } else {
            // The number to call comes before the first service; later lines are remarks
            if (!service && services.length === 0) phones.push(...numbers(text(line)))
            service = undefined
        }
    })
    if (services.length === 0) return []
    if (elsewhere > 0)
        unreadable.push(
            `email: ${elsewhere} of ${services.filter((c) => c.type === 'email').length} mailboxes are shown over a link to another address; the address shown is kept`,
        )
    return [
        ...[...new Set(phones)].map((value) => ({ type: 'phone' as const, value })),
        ...services,
    ]
}

export function readCourtPage(url: string, home: string, contact: string): CourtPage {
    const lang = /^https:\/\/[^/]+\/(nl|fr|de)\//.exec(url)?.[1]
    if (lang !== 'nl' && lang !== 'fr' && lang !== 'de') throw new Error(`No language in ${url}`)
    const homeDoc = parse(home)
    const title = clean(homeDoc.querySelector('title')?.textContent ?? '').replace(SITE_SUFFIX, '')
    const doc = parse(contact)
    const unreadable: string[] = []

    const addressItem = doc.querySelector('#list-address .paragraph--type--address li')
    let address: Address | undefined
    if (addressItem) {
        const lines = addressItem.innerHTML
            .split(/<br\s*\/?>|\n/)
            .map((line) => clean(parse(line).textContent))
            .filter(Boolean)
        address = toAddress(lines)
        if (!address) unreadable.push(`address: ${lines.join(' / ')}`)
    }

    const contacts: Contact[] = []
    const seen = new Set<HTMLElement>()
    // Contact blocks inside cards (registries, secretariat) first, so they get the card's title
    for (const card of doc.querySelectorAll(
        '.paragraph--type--griffie, .paragraph--type--secretariat',
    )) {
        const title = text(card.querySelector('.card__title'))
        for (const block of card.querySelectorAll('.paragraph--type--contact')) {
            seen.add(block)
            contacts.push(...readBlock(block, title.length <= 80 ? title : undefined, unreadable))
        }
    }
    for (const block of doc.querySelectorAll('.paragraph--type--contact')) {
        if (!seen.has(block)) contacts.push(...readBlock(block, undefined, unreadable))
    }
    // Contacts written as text in the contact tab: a phone menu is read, anything else that
    // holds a mailbox is reported, so that a page that changes shape doesn't lose its contacts
    // without a word
    for (const block of doc.querySelectorAll('#list-contact .paragraph--type--text')) {
        const read = readMenu(block, unreadable)
        contacts.push(...read)
        const published = new Set(
            block.querySelectorAll('a[href^="mailto:"]').flatMap((a) => mailbox(a).value ?? []),
        )
        for (const c of read) published.delete(c.value)
        if (published.size > 0)
            unreadable.push(
                `contact: ${published.size} e-mail ${published.size === 1 ? 'address' : 'addresses'} written as text ${published.size === 1 ? 'was' : 'were'} not read`,
            )
    }

    const hours = text(doc.querySelector('#list-hours')).replace(
        /^(Openingsuren|Heures d'ouverture|Öffnungszeiten)\s*/i,
        '',
    )
    return {
        url,
        lang,
        title,
        ...(address ? { address } : {}),
        // Services only: a person's own address or name is left out, and reported
        contacts: dedupe(withoutPeople(contacts, (line) => unreadable.push(line))),
        unreadable,
        ...(hours ? { openingHoursText: hours } : {}),
    }
}

/** Each contact once */
export function dedupe(contacts: Contact[]): Contact[] {
    const out = new Map<string, Contact>()
    for (const c of contacts) out.set(JSON.stringify([c.type, c.value, c.label, c.note]), c)
    return [...out.values()]
}
