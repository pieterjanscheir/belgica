/**
 * Laws that change the annex to the Judicial Code ("Bijvoegsel: Gebiedsomschrijving en zetel van
 * hoven en rechtbanken"), from the snapshots of etaamb, a copy of the Belgian Official Journal.
 *
 * The cantons come from the annex on Justel, which refuses GitHub's runners, so they're rebuilt
 * by hand (#52). etaamb can be read from the runners and lists every law the day it's published,
 * weeks or months before Justel updates the annex's text. A law that writes "bijvoegsel bij het
 * Gerechtelijk Wetboek" changes the annex (the Judicial Code has no other), and so does one that
 * names the code and then writes "bijvoegsel bij hetzelfde Wetboek". It's a sign the cantons may
 * have changed until the annex the cantons were built from (annex-version.json, written by
 * `pnpm build:cantons`) is updated to at least that law's publication date.
 *
 * etaamb is a volunteer project, not the official journal: it says when to look, the cantons
 * still come from Justel. When etaamb stops publishing, the signals say so, since a silent copy
 * would look like a quiet journal.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { etaambDay, isEtaambLaw } from '../sources/catalog.ts'
import { Snapshots } from '../sources/store.ts'

export interface AnnexVersion {
    /** The annex's ELI on Justel */
    eli: string
    /** Justel's "tekstbijwerking tot": the last publication date its text of the annex includes */
    consolidatedTo: string
}

export interface Amendment {
    numac: string
    title: string
    /** Publication date in the Official Journal (ISO) */
    published: string
    url: string
}

/** After this many days without a publication on etaamb, the signals say it may have stopped */
export const QUIET_DAYS = 10

const text = (html: string) =>
    html
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()

/** dd/mm/yyyy → yyyy-mm-dd */
const isoDate = (date: string) => date.split('/').reverse().join('-')

/** A law's page on etaamb, when the law changes the annex */
export function readAmendment(html: string, url: string): Amendment | undefined {
    const main = /<main\b[\s\S]*<\/main>/i.exec(html)?.[0] ?? html
    const body = text(main)
    const cites =
        /bijvoegsel bij het Gerechtelijk Wetboek/i.test(body) ||
        (/bijvoegsel bij hetzelfde Wetboek/i.test(body) && /Gerechtelijk Wetboek/i.test(body))
    if (!cites) return undefined
    const numac = /<dd class="numac">\s*(\d{10})\s*<\/dd>/.exec(main)?.[1]
    const published = /<dt>pub\.<\/dt>\s*<dd class="date">\s*(\d{2}\/\d{2}\/\d{4})/.exec(main)?.[1]
    const title = /<h1 class="doc_title">([\s\S]*?)<\/h1>/.exec(main)?.[1]
    if (numac === undefined || published === undefined || title === undefined)
        throw new Error(`${url}: a law that changes the annex, without its numac, date or title`)
    return { numac, title: text(title), published: isoDate(published), url }
}

export function readAnnexAmendments(root: string): {
    amendments: Amendment[]
    /** The last day etaamb published, or undefined when it wasn't read */
    lastPublication: string | undefined
    /** Laws that change the annex, whose page couldn't be read: the reason, with the URL */
    unreadable: string[]
} {
    if (!existsSync(join(root, 'etaamb', 'index.json')))
        return { amendments: [], lastPublication: undefined, unreadable: [] }
    const snapshots = new Snapshots(root, 'etaamb')
    const amendments: Amendment[] = []
    const unreadable: string[] = []
    let lastPublication: string | undefined
    for (const entry of snapshots.entries()) {
        if (entry.status !== 200) continue
        const day = etaambDay(entry.url)
        if (day !== undefined && (lastPublication === undefined || day > lastPublication))
            lastPublication = day
        if (!isEtaambLaw(entry.url)) continue
        const html = snapshots.text(entry.url)
        if (html === undefined) continue
        // A page etaamb laid out differently is reported, not thrown: etaamb only says when to
        // look, and the rest of the data doesn't wait for it
        try {
            const amendment = readAmendment(html, entry.url)
            if (amendment) amendments.push(amendment)
        } catch (error) {
            unreadable.push((error as Error).message)
        }
    }
    amendments.sort((a, b) => a.published.localeCompare(b.published))
    return { amendments, lastPublication, unreadable }
}

export const readAnnexVersion = (): AnnexVersion =>
    JSON.parse(readFileSync(new URL('annex-version.json', import.meta.url), 'utf8')) as AnnexVersion

/** Signs that a law changed the annex after the version the cantons were built from */
export function annexSignals({
    amendments,
    lastPublication,
    unreadable = [],
    version,
    today = new Date().toISOString().slice(0, 10),
}: {
    amendments: readonly Amendment[]
    lastPublication: string | undefined
    unreadable?: readonly string[]
    version: AnnexVersion
    today?: string
}): string[] {
    const signals = amendments
        .filter((law) => law.published > version.consolidatedTo)
        .map(
            (law) =>
                `annex: "${law.title}" (numac ${law.numac}, published ${law.published}) changes the annex to the Judicial Code, and the cantons were built from its text up to ${version.consolidatedTo}: ${law.url}`,
        )
    for (const reason of unreadable) signals.push(`annex: ${reason}: read it by hand`)
    if (lastPublication === undefined)
        signals.push(
            'annex: etaamb could not be read, so a law that changes the annex may be missed',
        )
    else if (Date.parse(today) - Date.parse(lastPublication) > QUIET_DAYS * 86_400_000)
        signals.push(
            `annex: etaamb has published nothing since ${lastPublication}, so a law that changes the annex may be missed`,
        )
    return signals
}
