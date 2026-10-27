/**
 * The official sources and how to walk them. Each source fetches its pages through `get`,
 * which stores every response; the parsers in scripts/parse read the snapshots back.
 */
import type { Response } from './http.ts'

export type Get = (url: string) => Promise<Response>

export interface Source {
    name: string
    description: string
    fetch: (get: Get) => Promise<void>
}

const html = (res: Response) => (res.status === 200 ? res.body.toString('utf8') : '')

/** Absolute URLs of the links in a page (or in its <main> element), without fragments */
export function links(page: string, base: string, { mainOnly = false } = {}): string[] {
    const scope = mainOnly ? (/<main\b[\s\S]*<\/main>/i.exec(page)?.[0] ?? '') : page
    const out = new Set<string>()
    for (const [, href = ''] of scope.matchAll(/href="([^"]+)"/g)) {
        try {
            const url = new URL(href.replaceAll('&amp;', '&'), base)
            url.hash = ''
            if (url.protocol === 'https:' || url.protocol === 'http:') out.add(url.href)
        } catch {
            // Not a URL
        }
    }
    return [...out]
}

/** The other-language versions of a page, from its language switcher */
export function translations(page: string, base: string): Map<string, string> {
    const out = new Map<string, string>()
    for (const [tag] of page.matchAll(/<a\b[^>]*\bhreflang="[a-z]{2}"[^>]*>/g)) {
        const lang = /hreflang="([a-z]{2})"/.exec(tag)?.[1]
        const href = /href="([^"]+)"/.exec(tag)?.[1]
        if (lang && href && !out.has(lang)) out.set(lang, new URL(href, base).href)
    }
    return out
}

const PORTAL = 'https://www.tribunaux-rechtbanken.be'

/** The portal's list page of each kind of court, in Dutch; the others come from its switcher */
export const COURT_LISTS = [
    '/nl/rechtbanken/vredegerecht',
    '/nl/rechtbanken/politierechtbank',
    '/nl/rechtbanken/rechtbank-van-eerste-aanleg',
    '/nl/rechtbanken/ondernemingsrechtbank',
    '/nl/rechtbanken/arbeidsrechtbank',
    '/nl/hoven/hof-van-beroep',
    '/nl/hoven/arbeidshof',
    '/nl/hoven/hof-van-assisen',
].map((path) => PORTAL + path)

/** A court's own page on the portal: one path segment after the language */
export const isCourtPage = (url: string) =>
    url.startsWith(PORTAL) && /^\/(nl|fr|de)\/[^/]+$/.test(new URL(url).pathname)

const courts: Source = {
    name: 'courts',
    description: 'tribunaux-rechtbanken.be: every court and division, with its contact page',
    async fetch(get) {
        const pages = new Set<string>()
        for (const list of COURT_LISTS) {
            const res = await get(list)
            const page = html(res)
            for (const [lang, url] of translations(page, res.url)) {
                if (lang === 'nl') continue
                const other = html(await get(url))
                for (const link of links(other, url, { mainOnly: true }))
                    if (isCourtPage(link)) pages.add(link)
            }
            for (const link of links(page, res.url, { mainOnly: true }))
                if (isCourtPage(link)) pages.add(link)
        }
        for (const page of [...pages].sort()) {
            await get(page)
            await get(page + '/contact')
        }
    },
}

const PRISONS =
    'https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen'

const prisons: Source = {
    name: 'prisons',
    description:
        'justitie.belgium.be: every prison and detention house, in Dutch, French and German',
    async fetch(get) {
        const res = await get(PRISONS)
        const pages = links(html(res), res.url).filter((url) =>
            /\/(gevangenissen|detentiehuizen)\/adres_/.test(url),
        )
        for (const url of pages.sort()) {
            const page = await get(url)
            for (const [lang, other] of translations(html(page), page.url))
                if (lang !== 'nl') await get(other)
        }
    },
}

const housesOfJustice: Source = {
    name: 'houses-of-justice',
    description:
        'vlaanderen.be (Flemish Community) and maisonsdejustice.be (French Community): every house of justice',
    async fetch(get) {
        await get(
            'https://www.vlaanderen.be/agentschap-justitie-en-handhaving/justitie/justitiehuizen',
        )
        const list = 'https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/'
        const res = await get(list)
        const pages = links(html(res), res.url).filter((url) =>
            url.startsWith(list + 'maison-justice-'),
        )
        // A maintenance page answers 200 without the list; an empty walk would retire them all
        if (pages.length === 0) throw new Error(`No houses of justice listed on ${res.url}`)
        for (const url of pages.sort()) await get(url)
    },
}

/** The download links on a Statbel open-data page */
async function statbelDownloads(get: Get, page: string, pattern: RegExp): Promise<void> {
    const res = await get(page)
    for (const url of links(html(res), res.url)) if (pattern.test(url)) await get(url)
}

const statbel: Source = {
    name: 'statbel',
    description: 'Statbel open data: REFNIS codes and the population per judicial canton',
    async fetch(get) {
        await statbelDownloads(get, 'https://statbel.fgov.be/nl/open-data/refnis-code-0', /\.zip$/)
        await statbelDownloads(
            get,
            'https://statbel.fgov.be/nl/open-data/bevolkingscijfers-gerechtelijke-kantons-2',
            /TF_POP_CANTONS_\d{4}\.zip$/,
        )
    },
}

/** Statbel's page on its geographic nomenclatures: REFNIS codes, sub-municipalities, postal codes */
export const STATBEL_GEOGRAPHY =
    'https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie'

/**
 * Statbel's conversion tables from postal codes to REFNIS codes, one per state of the
 * municipalities: `…_va01012025.xlsx` is valid from 1 January 2025
 */
export const isPostalCodeTable = (url: string) =>
    /\/Conversion(?:%20| )Postal(?:%20| )code_Refnis(?:%20| )code_va\d{8}\.xlsx$/i.test(url)

const postalCodes: Source = {
    name: 'postal-codes',
    description: 'Statbel: the conversion tables from postal codes to REFNIS codes',
    async fetch(get) {
        const res = await get(STATBEL_GEOGRAPHY)
        for (const url of links(html(res), res.url).sort())
            if (isPostalCodeTable(url)) await get(url)
    },
}

/**
 * The judicial cantons as geometry: the NGI's "Judicial cantons and arrondissements" dataset
 * (Territorial Divisions), GeoPackage in WGS 84, from its geo.be record
 * https://www.geo.be/catalog/details/e1f61c40-623a-11eb-9e7c-186571a04de3. The record also
 * offers Belgian Lambert 2008 and shapefiles; the parser reads this one.
 */
export const NGI_CANTONS =
    'https://ac.ngi.be/remoteclient-open/ngi-standard-open/Vectordata/TerritorialDivisions/TerritorialDivisions-JudicialCanton/e1f61c40-623a-11eb-9e7c-186571a04de3_geopackage+sqlite3_4326.zip'

const ngi: Source = {
    name: 'ngi',
    description:
        'geo.be (National Geographic Institute): the boundaries of the judicial cantons, as a GeoPackage',
    async fetch(get) {
        await get(NGI_CANTONS)
    },
}

export const sources: Source[] = [courts, prisons, housesOfJustice, statbel, postalCodes, ngi]
