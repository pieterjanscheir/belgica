/**
 * The data holds the contacts of services, never of people: a record about a person is personal
 * data (docs/data/roadmap.md). A source sometimes publishes a clerk's own e-mail address, or a
 * name in the title of a contact card, as a service's contact. These functions find those, and
 * `withoutPeople` leaves them out and says what it left out, without repeating it.
 *
 * Neither check can be certain. A value that looks like a person's and has no word a service
 * uses is left out rather than published, and the data pull request lists it: when it was a
 * service's after all, a person adds its word to `SERVICE_WORDS`.
 */
import { readFileSync } from 'node:fs'

import type { Contact } from './types.ts'

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * Every municipality, canton, arrondissement, judicial area and province name, folded and with
 * only its letters: 'sintniklaas', 'liege'. Whole names, not their words: 'pierre' and 'marie'
 * are words of place names and first names both.
 */
const PLACE_NAMES = new Set<string>()
for (const file of [
    'municipalities',
    'cantons',
    'arrondissements',
    'judicial-areas',
    'provinces',
]) {
    const records = JSON.parse(
        readFileSync(new URL(`../../data/${file}.json`, import.meta.url), 'utf8'),
    ) as { name: Record<string, string> }[]
    for (const record of records)
        for (const name of Object.values(record.name))
            PLACE_NAMES.add(fold(name).replace(/[^a-z]/g, ''))
}
// Municipalities whose name is also a first name
for (const name of ['herve', 'peer']) PLACE_NAMES.delete(name)

/**
 * Words (accents folded, lower case) that mark an address or a label as a service's: what a
 * registry or a secretariat is called, and the courts' own abbreviations in their addresses
 */
const SERVICE_WORDS = new Set([
    // Registries, secretariats and their services
    ...['greffe', 'greffes', 'greffier', 'greffiers', 'griffie', 'griffier', 'grf', 'kanzlei'],
    ...['secretariaat', 'secretariat', 'dienst', 'service', 'services', 'section', 'sectie'],
    ...['afdeling', 'division', 'chambre', 'kamer', 'bureau', 'accueil', 'onthaal', 'info'],
    ...['algemeen', 'algemene', 'general', 'generaux', 'organisatie', 'pro', 'deo'],
    ...['role', 'roles', 'rol', 'rollen', 'actes', 'expertise', 'compta', 'comptabilite'],
    ...['boekhouding', 'faillites', 'faillissementen', 'insolventie', 'insolvabilite'],
    ...['jeunesse', 'jeugd', 'famille', 'familie', 'civil', 'civile', 'burgerlijk', 'burgerlijke'],
    ...['penal', 'correctionnel', 'correctioneel', 'social', 'sociale', 'mediation'],
    ...['gerechtsdeskundigen', 'overtuigingsstukken', 'collectieve', 'schuldenregeling'],
    ...['politierechtbank', 'rechtbank', 'tribunal', 'cour', 'hof', 'arbeidshof', 'vred', 'jp'],
    ...['justice', 'paix', 'vredegerecht', 'friedensgericht', 'gericht', 'siege', 'zetel'],
    ...['president', 'presidence', 'presidente', 'voorzitter', 'secretaire', 'hoofdgriffier'],
    ...['justitiehuis', 'maisondejustice', 'gevangenis', 'prison', 'detentiehuis'],
    // Abbreviations of courts and services in @just.fgov.be addresses
    ...['bw', 'cra', 'ced', 'rcd', 'tebw', 'tefb', 'ttfb', 'tpilie', 'tpinamur', 'tpifbxl'],
    ...['realeuven', 'argent', 'tradint', 'jeunesseprotect', 'greffea', 'griffiegent'],
    ...['griffiebrugge', 'gentarbeidshof', 'brusselnl', 'ttliegedivliege', 'paifve'],
])

const isServiceWord = (word: string) => SERVICE_WORDS.has(word) || PLACE_NAMES.has(word)

/** Two words of letters, the second of at least three: 'first.last', 'f.last' */
const NAME_SHAPED_ADDRESS = /^[a-z]+(?:-[a-z]+)*\.(?=[a-z-]{3,}$)[a-z]+(?:-[a-z]+)*$/

/**
 * Whether an e-mail address looks like a person's own: a local part shaped like a name
 * ('first.last'), neither word of which is a place or a service's word. A service's address
 * in that shape names a place or a service: 'griffie.dinant', 'vred.stniklaas'.
 */
export function isPersonalEmail(email: string): boolean {
    const local = email.slice(0, email.lastIndexOf('@')).toLowerCase()
    if (!NAME_SHAPED_ADDRESS.test(local)) return false
    return !local.split('.').some((word) => isServiceWord(word.replaceAll('-', '')))
}

const TITLE = /^(?:m\.|mr\.?|mme|madame|monsieur|mevr\.?|mevrouw|dhr\.?|de heer|herr|frau)\s/i
const PARTICLE = `(?:(?:de|van|den|der|du|le|la|von)\\s)*`
/** Two to four words that each start with a capital, with a name's particles between them */
const NAME_SHAPED_LABEL = new RegExp(
    `^\\p{Lu}[\\p{L}'-]+(?:\\s${PARTICLE}\\p{Lu}[\\p{L}'-]+){1,3}$`,
    'u',
)

/** A label's words, each also with only its letters: 'Fosses-la-Ville' is 'fosseslaville' too */
const labelWords = (part: string) =>
    fold(part)
        .split(/[\s']+/)
        .flatMap((word) => [word.replace(/[^a-z]/g, ''), ...word.split(/[^a-z]+/)])

const isPersonName = (part: string) =>
    TITLE.test(part) || (NAME_SHAPED_LABEL.test(part) && !labelWords(part).some(isServiceWord))

/**
 * A label without the part that names a person: 'Jan Janssens - secretariaat' gives
 * 'secretariaat'. `undefined` when nothing is left; the label as it is when it names no one.
 */
export function withoutPersonName(label: string): string | undefined {
    const parts = label.split(/\s+[-–|:]\s+/)
    if (!parts.some(isPersonName)) return label
    const kept = parts.filter((part) => !isPersonName(part))
    return kept.length > 0 ? kept.join(' - ') : undefined
}

/**
 * The contacts without a person's own e-mail address, and without a person's name in a label.
 * `report` gets a line for each thing left out, which never holds the address or the name.
 */
export function withoutPeople(contacts: Contact[], report: (line: string) => void): Contact[] {
    const out: Contact[] = []
    for (const contact of contacts) {
        const label = contact.label === undefined ? undefined : withoutPersonName(contact.label)
        if (label !== contact.label)
            report(`label: a person's name was left out${label ? ` of "… - ${label}"` : ''}`)
        if (contact.type === 'email' && isPersonalEmail(contact.value)) {
            report(
                `email: an address that looks like a person's own was left out${label ? ` (${label})` : ''}`,
            )
            continue
        }
        // The keys in the order they had
        out.push(
            Object.fromEntries(
                Object.entries(contact).flatMap(([key, value]) =>
                    key !== 'label' ? [[key, value]]
                    : label === undefined ? []
                    : [[key, label]],
                ),
            ) as Contact,
        )
    }
    return out
}
