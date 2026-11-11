/**
 * Prisons and houses of justice: places with a name, an address and contacts, read from the
 * FPS Justice site (prisons) and the Communities' sites (houses of justice).
 */
import { parse, type HTMLElement } from 'node-html-parser'

import { toId } from '../id.ts'
import { links, translations } from '../sources/catalog.ts'
import { Snapshots } from '../sources/store.ts'
import { clean, toAddress, toE164, toEmail, toIban } from './normalize.ts'
import type { Contact, HouseOfJustice, Locale, Prison } from './types.ts'

type Lang = Locale

export type { HouseOfJustice, Prison } from './types.ts'

/**
 * The language a place takes its id from, by postal code: Brussels (1000–1299) takes Dutch, as
 * elsewhere; Walloon Brabant and Wallonia French, except the German-speaking area (4700–4799)
 */
export function localLanguage(postalCode: string): Lang {
    const n = Number(postalCode)
    if (n >= 4700 && n <= 4799) return 'de'
    if ((n >= 1300 && n <= 1499) || (n >= 4000 && n <= 7999)) return 'fr'
    return 'nl'
}

/** An id from a name, without its articles: 'Gevangenis van Gent' → 'gevangenis-gent' */
export const nameId = (name: string) =>
    toId(name.replace(/\b(?:van|de|du|des|het|la|le)\s+|\b[dl]'/gi, ' '))

/**
 * Ids kept when a prison is renamed, by the last segment of its Dutch page's URL. Ids are public
 * API (scripts/lock-ids.ts): a new name on the same page is the same prison, so it keeps the id
 * its old name gave it instead of retiring it for a new one.
 */
export const PINNED_PRISON_IDS: Readonly<Record<string, string>> = {
    // 'Gevangenis van Antwerpen' became 'Gevangenis Antwerpen De Vest' in November 2026
    adres_gevangenis_antwerpen_0: 'gevangenis-antwerpen',
}

/** A prison's id: the one pinned to its page, or else one from its local-language name */
export const prisonId = (nlUrl: string, localName: string) =>
    PINNED_PRISON_IDS[nlUrl.split('/').pop() ?? ''] ?? nameId(localName)

const text = (el: HTMLElement | null | undefined) => (el ? clean(el.textContent) : '')

function sourceRefs(snapshots: Snapshots, urls: string[]) {
    return urls.flatMap((url) => {
        const retrieved = snapshots.entry(url)?.retrieved
        return retrieved ? [{ url, retrieved }] : []
    })
}

export function buildPrisons(root: string): { prisons: Prison[]; problems: string[] } {
    const snapshots = new Snapshots(root, 'prisons')
    const problems: string[] = []
    const prisons: Prison[] = []
    const index = snapshots.entries().find((e) => e.url.endsWith('/belgische_gevangenissen'))
    const indexPage = index && snapshots.text(index.url)
    if (!index || !indexPage) throw new Error('No snapshot of the list of prisons')
    const pages = links(indexPage, index.url).filter((url) =>
        /\/(gevangenissen|detentiehuizen)\/adres_/.test(url),
    )
    for (const nl of [...new Set(pages)].sort()) {
        const page = snapshots.text(nl)
        if (!page) {
            problems.push(`${nl}: not fetched`)
            continue
        }
        const urls: Partial<Record<Lang, string>> = { nl }
        for (const [lang, url] of translations(page, nl))
            if ((lang === 'fr' || lang === 'de') && snapshots.text(url)) urls[lang] = url
        const name: Partial<Record<Lang, string>> = {}
        const docs: Partial<Record<Lang, HTMLElement>> = {}
        for (const [lang, url] of Object.entries(urls) as [Lang, string][]) {
            const doc = parse(snapshots.text(url) ?? '')
            docs[lang] = doc
            name[lang] = text(doc.querySelector('h1.page__title')).replace(/\s{2,}/g, ' ')
        }
        const doc = docs.nl
        const addr = doc?.querySelector('.field--name-field-address')
        const postalCode = text(addr?.querySelector('.postal-code'))
        const local = docs[localLanguage(postalCode)] ?? doc
        const localAddr = local?.querySelector('.field--name-field-address')
        const address = toAddress([
            text(localAddr?.querySelector('.address-line1')),
            `${text(localAddr?.querySelector('.postal-code'))} ${text(localAddr?.querySelector('.locality'))}`,
        ])
        const localName = name[localLanguage(postalCode)] ?? name.nl
        if (!address || !localName) {
            problems.push(`${nl}: no address or name`)
            continue
        }
        const contacts: Contact[] = []
        for (const a of doc?.querySelectorAll('.field--name-field-phone a') ?? []) {
            const value = toE164(a.getAttribute('href')?.replace('tel:', '') ?? '')
            const type = a.classList.contains('fax') ? 'fax' : 'phone'
            if (value) contacts.push({ type, value })
            else problems.push(`${nl}: ${type} ${text(a)}`)
        }
        for (const a of doc?.querySelectorAll('.field--name-field-email a[href^="mailto:"]') ??
            []) {
            const value = toEmail(a.getAttribute('href') ?? '')
            if (value) contacts.push({ type: 'email', value })
        }
        // The account for money for prisoners, in the page's text
        const ibans = new Set(
            (doc?.textContent.match(/BE\d{2}(?:\s?\d{4}){3}/g) ?? []).flatMap(
                (m) => toIban(m) ?? [],
            ),
        )
        for (const value of ibans) contacts.push({ type: 'bank-account', value })
        prisons.push({
            id: prisonId(nl, localName),
            kind: nl.includes('/detentiehuizen/') ? 'detention-house' : 'prison',
            name,
            address,
            contacts,
            website: urls,
            sources: sourceRefs(snapshots, Object.values(urls)),
        })
    }
    prisons.sort((a, b) => a.id.localeCompare(b.id))
    return { prisons, problems }
}

const FLEMISH =
    'https://www.vlaanderen.be/agentschap-justitie-en-handhaving/justitie/justitiehuizen'
const FRENCH = 'https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/'

export function buildHousesOfJustice(root: string): {
    houses: HouseOfJustice[]
    problems: string[]
} {
    const snapshots = new Snapshots(root, 'houses-of-justice')
    const problems: string[] = []
    const houses: HouseOfJustice[] = []

    const flemish = snapshots.text(FLEMISH)
    if (!flemish) throw new Error('No snapshot of the Flemish houses of justice')
    for (const block of parse(flemish).querySelectorAll(
        '[itemtype="http://schema.org/GovernmentBuilding"]',
    )) {
        const name = text(block.querySelector('.vl-infoblock__title'))
        const props = new Map<string, HTMLElement>()
        for (const dt of block.querySelectorAll('dt.vl-properties__label')) {
            const dd = dt.nextElementSibling
            if (dd) props.set(text(dt), dd)
        }
        const lines = props.get('Adres')?.querySelectorAll('p').map(text) ?? []
        const line = lines.at(-1) ?? ''
        const address = toAddress(line.replace(/,\s*België$/, '').split(/,\s*(?=\d{4}\s)/))
        const email = toEmail(props.get('E-mail')?.querySelector('a')?.getAttribute('href') ?? '')
        const phone = toE164(
            props.get('Telefoon')?.querySelector('a')?.getAttribute('href')?.replace('tel:', '') ??
                '',
        )
        const ovo = /\/Organisation\/(OVO\d+)/.exec(block.innerHTML)?.[1]
        if (!name || !address) {
            problems.push(`${FLEMISH}: no name or address for "${name}"`)
            continue
        }
        houses.push({
            id: nameId(name),
            community: 'flemish',
            name: { nl: name },
            ...(ovo ? { ovo } : {}),
            address,
            contacts: [
                ...(phone ? [{ type: 'phone' as const, value: phone }] : []),
                ...(email ? [{ type: 'email' as const, value: email }] : []),
            ],
            website: { nl: FLEMISH },
            sources: sourceRefs(snapshots, [FLEMISH]),
        })
    }

    for (const entry of snapshots.entries()) {
        if (!entry.url.startsWith(FRENCH + 'maison-justice-')) continue
        const page = snapshots.text(entry.url)
        if (!page) continue
        const doc = parse(page)
        const name = text(doc.querySelector('#pagecartouche h1'))
        // Sections open with a bold title: Adresse, Heures d'ouverture, the victims' service
        const sections: { title: string; lines: string[] }[] = []
        for (const p of doc.querySelectorAll('#pagecartouche p.bodytext')) {
            // Each bold title on a line of its own, without the line breaks some put inside it
            const html = p.innerHTML.replace(
                /<b>([\s\S]*?)<\/b>/g,
                (_, title: string) => `<br><b>${title.replace(/<br\s*\/?>/g, ' ')}</b><br>`,
            )
            for (const part of html.split(/<br\s*\/?>/)) {
                const bold = /<b>([\s\S]*?)<\/b>/.exec(part)
                const line = clean(parse(part).textContent)
                const title = bold ? clean(parse(bold[1] ?? '').textContent) : ''
                if (title) sections.push({ title, lines: [] })
                else if (line) sections.at(-1)?.lines.push(line)
            }
        }
        const contactsOf = (lines: string[], label?: string): Contact[] =>
            lines.flatMap((line): Contact[] => {
                const phone = /^(Tél|Tel|Fax)?\.?\s*:?\s*([\d\s+/.]{9,})$/i.exec(line)
                if (phone) {
                    const value = toE164(phone[2] ?? '')
                    const type = /fax/i.test(phone[1] ?? '') ? 'fax' : 'phone'
                    return value ? [{ type, value, ...(label ? { label } : {}) }] : []
                }
                const value = toEmail(line.replace(/\(at\)/i, '@').replace(/\s/g, ''))
                return value ? [{ type: 'email', value, ...(label ? { label } : {}) }] : []
            })
        const main = sections.find((s) => /^adresse\b/i.test(s.title))
        // The address ends with its postal code and city; phone and email follow
        const end = main?.lines.findIndex((l) => /^\d{4}\s+\D/.test(l)) ?? -1
        const addressLines = end >= 0 ? main?.lines.slice(0, end + 1) : undefined
        const address = addressLines && toAddress(addressLines)
        if (!name || !main || !address) {
            problems.push(`${entry.url}: no name or address`)
            continue
        }
        const victims = sections.find((s) => /victimes/i.test(s.title))
        houses.push({
            id: nameId(name),
            community: 'french',
            name: { fr: name },
            address,
            contacts: [
                ...contactsOf(main.lines),
                ...(victims ?
                    contactsOf(victims.lines, victims.title.replace(/^Contacter le\s*/i, ''))
                :   []),
            ],
            website: { fr: entry.url },
            sources: sourceRefs(snapshots, [entry.url]),
        })
    }
    houses.sort((a, b) => a.id.localeCompare(b.id))
    return { houses, problems }
}
