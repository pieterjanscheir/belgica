/**
 * Rebuilds data/municipalities.json and data/cantons.json from the official sources:
 *
 * - The annex to the Judicial Code ("Bijvoegsel: Gebiedsomschrijving en zetel van hoven en
 *   rechtbanken", Justel 1967101007), in Dutch and French. It lists every judicial canton,
 *   its seat, and the municipalities (or parts of them) it covers.
 * - Statbel's population-by-municipality file, for the current municipalities with their
 *   REFNIS codes and the codes of their province and region (CC BY 4.0).
 * - German names, for the few cantons an official German text names: see
 *   scripts/german-canton-names.ts.
 *
 * The Dutch and French texts are parsed independently and must agree, and every municipality
 * must be covered exactly once (or split over several cantons). The script refuses to write
 * anything otherwise.
 *
 * Run with `pnpm build:cantons`, by hand on a regular machine: it needs network access and the
 * `unzip` command, and ejustice refuses connections from GitHub's runners
 * (https://github.com/pieterjanscheir/belgica/issues/52), so the sources workflow can't
 * run it. Rerun it after a law changes the annex or municipalities merge. It also records the
 * date Justel's text of the annex is updated to in scripts/parse/annex-version.json, so the
 * sources run can tell which laws on etaamb the cantons don't include yet.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { germanCantonNames } from './german-canton-names.ts'
import { toId } from './id.ts'

const JUSTEL_ID = '1967101007'
/** The annex's ELI: its own Belgian Official Journal number (numac), not the Justel file number */
const ANNEX_ELI = 'https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel'
const STATBEL_YEAR = 2026
const STATBEL_URL = `https://statbel.fgov.be/sites/default/files/files/opendata/bevolking%20naar%20woonplaats%2C%20nationaliteit%20burgelijke%20staat%20%2C%20leeftijd%20en%20geslacht/TF_SOC_POP_STRUCT_${STATBEL_YEAR}.zip`

type Lang = 'nl' | 'fr'

interface Municipality {
    refnis: string
    name: Record<Lang, string>
    /** REFNIS code of the province, or the Brussels-Capital Region */
    province: string
    /** REFNIS code of the region */
    region: string
}

// Statbel puts the Brussels-Capital Region where other municipalities have their province
const BRUSSELS = '04000'

// Annex section ("afdeling") → arrondissement id, whether the area is French-speaking (canton
// ids then use the French name), and the province (REFNIS) whose municipalities it lists. Matching
// names only within the province keeps "Saint-Nicolas" (Sint-Niklaas) apart from
// Saint-Nicolas near Liège. Sections 4, 5 and 8 hold more than one arrondissement; see
// `arrondissementOf`.
const sections: Record<number, { arrondissement: string; french: boolean; province: string }> = {
    1: { arrondissement: 'antwerpen', french: false, province: '10000' },
    2: { arrondissement: 'limburg', french: false, province: '70000' },
    3: { arrondissement: 'brabant-wallon', french: true, province: '20002' },
    4: { arrondissement: 'brussel', french: false, province: BRUSSELS },
    5: { arrondissement: 'leuven', french: false, province: '20001' },
    6: { arrondissement: 'oost-vlaanderen', french: false, province: '40000' },
    7: { arrondissement: 'west-vlaanderen', french: false, province: '30000' },
    8: { arrondissement: 'liege', french: true, province: '60000' },
    9: { arrondissement: 'luxembourg', french: true, province: '80000' },
    10: { arrondissement: 'namur', french: true, province: '90000' },
    11: { arrondissement: 'hainaut', french: true, province: '50000' },
}

// Art. 4 of the annex: the Flemish-Brabant cantons that belong to Brussels, and the two
// German-speaking cantons that form the arrondissement Eupen.
const brusselsCantonsInFlemishBrabant = [
    'Asse',
    'Halle',
    'Lennik',
    'Meise',
    'Sint-Genesius-Rode',
    'Vilvoorde',
    'Zaventem',
]

/** A value the source must have; fails loudly instead of writing `undefined` into the data */
function must<T>(value: T | undefined, what: string): T {
    if (value === undefined) throw new Error(`Missing ${what}`)
    return value
}

const sectionOf = (section: number) => must(sections[section], `annex section ${section}`)

function arrondissementOf(section: number, nameNl: string): string {
    if (section === 5 && brusselsCantonsInFlemishBrabant.includes(nameNl)) return 'brussel'
    if (section === 8 && nameNl === 'Eupen-Sankt-Vith') return 'eupen'
    return sectionOf(section).arrondissement
}

// Names the annex uses that Statbel doesn't have (exonyms, older spellings), by REFNIS code.
const aliases: Record<string, string[]> = {
    '23077': ['Leeuw-Saint-Pierre'], // Sint-Pieters-Leeuw
    '25123': ['Roosbeek'], // Rebecq
    '38014': ['Coxyde'], // Koksijde
    '46021': ['Saint-Nicolas'], // Sint-Niklaas
    '92142': ['Gembloers'], // Gembloux
}

// Municipalities a canton's text names only as a boundary, in a way the parser can't tell apart.
const boundaryOnly: Record<string, string[]> = {
    '8.10': ['62051'], // Luik 3: "begrensd ten noorden door … en de gemeente Herstal"
}

// Typos in the annex itself.
const typos: Record<Lang, Record<string, string>> = {
    nl: { 'stad Aast': 'stad Aalst', Herenhout: 'Herenthout' },
    // "canton judicaire de Bruxelles" (third canton of Brussels)
    fr: { 'canton judicaire': 'canton judiciaire' },
}

const ordinals: Record<Lang, Record<string, number>> = {
    nl: {
        eerste: 1,
        tweede: 2,
        derde: 3,
        vierde: 4,
        vijfde: 5,
        zesde: 6,
        zevende: 7,
        achtste: 8,
        negende: 9,
        tiende: 10,
    },
    fr: {
        premier: 1,
        second: 2,
        deuxième: 2,
        troisième: 3,
        quatrième: 4,
        cinquième: 5,
        sixième: 6,
        septième: 7,
        huitième: 8,
        neuvième: 9,
        dixième: 10,
    },
}

// ---------------------------------------------------------------------------------------------

async function fetchText(url: string, encoding = 'utf-8'): Promise<string> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
    return new TextDecoder(encoding).decode(await res.arrayBuffer())
}

async function fetchAnnex(lang: Lang): Promise<string> {
    const url = `https://www.ejustice.just.fgov.be/cgi_loi/article.pl?language=${lang}&lg_txt=${lang[0]}&cn_search=${JUSTEL_ID}&caller=list`
    const html = await fetchText(url, 'windows-1252')
    if (html.includes('HTTP Request throttled'))
        throw new Error('Justel is throttling; try again in a minute')
    const text = html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/\s+/g, ' ')
    // The article text starts at the first fictive article; the table of contents doesn't list it
    const start = text.indexOf('Art. M1.')
    if (start === -1) throw new Error(`Annex text (${lang}) not found`)
    return text.slice(start)
}

/**
 * The last publication date Justel's text of the annex includes ("tekstbijwerking tot"), as an
 * ISO date. The sources run compares the laws that change the annex against it
 * (scripts/parse/annex-amendments.ts).
 */
async function fetchConsolidatedTo(): Promise<string> {
    const html = await fetchText(ANNEX_ELI, 'windows-1252')
    const date =
        /(?:tekstbijwerking|mise à jour du texte) (?:tot|au) (\d{2})-(\d{2})-(\d{4})/i.exec(html)
    if (!date) throw new Error(`${ANNEX_ELI}: no "tekstbijwerking tot" date`)
    return `${date[3]}-${date[2]}-${date[1]}`
}

async function fetchMunicipalities(): Promise<Municipality[]> {
    const dir = mkdtempSync(join(tmpdir(), 'statbel-'))
    const zip = join(dir, 'pop.zip')
    const res = await fetch(STATBEL_URL)
    if (!res.ok) throw new Error(`Statbel: HTTP ${res.status}`)
    writeFileSync(zip, Buffer.from(await res.arrayBuffer()))
    const csv = execFileSync('unzip', ['-p', zip], { maxBuffer: 1 << 30 }).toString('utf-8')
    const [header, ...rows] = csv.replace(/^\uFEFF/, '').split(/\r?\n/)
    const col = new Map(
        must(header, 'Statbel header')
            .split('|')
            .map((h, i) => [h, i]),
    )
    const byCode = new Map<string, Municipality>()
    for (const row of rows) {
        if (!row) continue
        const f = row.split('|')
        const field = (name: string) => must(f[must(col.get(name), `Statbel column ${name}`)], name)
        const refnis = field('CD_REFNIS')
        if (byCode.has(refnis)) continue
        byCode.set(refnis, {
            refnis,
            name: { nl: field('TX_DESCR_NL'), fr: field('TX_DESCR_FR') },
            province: field('CD_PROV_REFNIS'),
            region: field('CD_RGN_REFNIS'),
        })
    }
    return [...byCode.values()].sort((a, b) => a.refnis.localeCompare(b.refnis))
}

// ---------------------------------------------------------------------------------------------

interface Item {
    section: number
    index: number
    text: string
}

/** Splits article 1 (fictive articles M1–M11) into its numbered items. */
function splitItems(body: string, lang: Lang): Item[] {
    const art1 = body.slice(body.indexOf('Art. M1.'), body.indexOf('Art. 2.'))
    const sectionWord = lang === 'nl' ? 'Afdeling' : 'Section'
    const items: Item[] = []
    for (const part of art1.split(/Art\. M\d+\./).slice(1)) {
        const start = part.search(new RegExp(`${sectionWord} \\d+(?:ere)?\\. - `))
        // Text runs until the footnotes; drop amendment markers and deleted-text placeholders
        let text = part.slice(start, part.indexOf('----------'))
        text = text
            .replace(/\['>\d+ ?/g, '')
            .replace(/\]'>\d+/g, '')
            .replace(/\](\d{2}-\d{2}-\d{4}, (voor zover|dans la mesure)[\s\S]*)$/, '')
            .replace(/ \.\.\./g, '')
            .replace(/\s+/g, ' ')
            .trim()
        for (const [typo, fix] of Object.entries(typos[lang])) text = text.replaceAll(typo, fix)
        // French numbers the first section "1ere"
        const m = new RegExp(`^${sectionWord} (\\d+)(?:ere)?\\. - [^\\d]+? (?=1\\. )`).exec(text)
        if (!m) throw new Error(`Cannot read section header: ${text.slice(0, 80)}`)
        const section = Number(m[1])
        const rest = text.slice(m[0].length)
        // Items are "1. … 2. …"; only split on the next expected number to avoid street numbers
        let index = 1
        let pos = 0
        while (pos < rest.length) {
            const next = rest.indexOf(` ${index + 1}. `, pos)
            const end = next === -1 ? rest.length : next
            const text = rest.slice(pos + `${index}. `.length, end).trim()
            // Brussels and Flemish Brabant also name their administrative arrondissements
            if (!/administratie(?:f|ve) arrondissement|arrondissement administratif/.test(text)) {
                items.push({ section, index, text })
            }
            pos = end + 1
            index++
        }
    }
    return items
}

interface ParsedCanton {
    name: string
    number: number | undefined
    seat: string
    territory: string
    whole: Set<string>
    partial: Set<string>
}

const normalise = (s: string) =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’`]/g, "'")

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function parseItem(item: Item, lang: Lang, municipalities: Municipality[]): ParsedCanton {
    const text = item.text.replace(/\.$/, '')
    let territory: string, name: string | undefined, number: number | undefined, seat: string
    if (lang === 'nl') {
        const m = new RegExp(
            `^(.*?)(?: vorm(?:t|en)|,) (?:het (?:(${Object.keys(ordinals.nl).join('|')}) )?(?:gerechtelijk )?kanton ([^;:]+)|een gerechtelijk kanton) ?[;:] de zetel van (?:het )?gerecht is gevestigd te (.+)$`,
            'u',
        ).exec(text)
        if (!m)
            throw new Error(
                `nl ${item.section}.${item.index}: unexpected form: …${text.slice(-160)}`,
            )
        territory = must(m[1], 'territory')
        name = m[3]
        seat = must(m[4], 'seat')
        number = m[2] ? ordinals.nl[m[2]] : undefined
        if (m[2] && !number)
            throw new Error(`nl ${item.section}.${item.index}: unknown ordinal ${m[2]}`)
    } else {
        const m = new RegExp(
            `^(.*) forme(?:nt)? (?:le (?:(${Object.keys(ordinals.fr).join('|')}) )?canton(?: judiciaire)? (?:de |d'|du )?([^;:]+) ?[;:] le siège en est établi|un canton judiciaire dont le siège est(?: établi)?) (?:à|au) (.+)$`,
            'u',
        ).exec(text)
        if (!m)
            throw new Error(
                `fr ${item.section}.${item.index}: unexpected form: …${text.slice(-160)}`,
            )
        territory = must(m[1], 'territory')
        name = m[3]
        seat = must(m[4], 'seat')
        number = m[2] ? ordinals.fr[m[2]] : undefined
        if (m[2] && !number)
            throw new Error(`fr ${item.section}.${item.index}: unknown ordinal ${m[2]}`)
    }

    // Find municipalities. Longest names first, so "Sint-Pieters-Woluwe" wins over "Woluwe".
    const names = municipalities
        .filter((mu) => mu.province === sectionOf(item.section).province)
        // Either language: Statbel often gives Flemish municipalities their Dutch name in French
        .flatMap((mu) =>
            [mu.name.nl, mu.name.fr, ...(aliases[mu.refnis] ?? [])].map((name) => ({
                refnis: mu.refnis,
                name,
            })),
        )
        .sort((a, b) => b.name.length - a.name.length)
    // The annex and Statbel spell some names differently ("Hélecine"/"Hélécine",
    // "Sankt-Vith"/"Sankt Vith"), so match on a normalised form
    const alt = names.map((n) => escape(normalise(n.name)).replace(/[- ]/g, '[- ]')).join('|')
    const NAME = `(?<![\\p{L}\\-])(?:${alt})(?![\\p{L}\\-])`
    const key = (s: string) => normalise(s).toLowerCase().replace(/-/g, ' ')
    const byKey = new Map(names.map((n) => [key(n.name), n.refnis]))
    const byName = { has: (s: string) => byKey.has(key(s)), get: (s: string) => byKey.get(key(s)) }
    const kw =
        lang === 'nl' ?
            { area: `(?:stad|gemeente|steden|gemeenten)`, of: '', and: ' en ' }
        :   { area: `(?:ville|commune|villes|communes)`, of: `(?:de |d'|du )?`, and: ' et ' }
    // The French text once omits the comma ("de Gavere Merelbeke-Melle")
    const list = `${kw.of}${NAME}(?:(?:, |${kw.and}| )${kw.of}${NAME})*`
    const nameIn = (s: string) =>
        [...s.matchAll(new RegExp(NAME, 'giu'))].map((x) => must(byName.get(x[0]), `name ${x[0]}`))

    let rest = normalise(territory)
    const partial = new Set<string>()
    const take = (re: RegExp, into: Set<string> | null) => {
        rest = rest.replace(re, (all: string, ...groups: unknown[]) => {
            const named = groups.find((g): g is string => typeof g === 'string' && byName.has(g))
            if (into && named) into.add(must(byName.get(named), `name ${named}`))
            return ' '.repeat(all.length)
        })
    }
    if (lang === 'nl') {
        // Borders with neighbouring municipalities are not part of the canton
        take(
            new RegExp(
                `(?:\\p{L}*grens|scheidingslijn) (?:met|van|tussen) (?:de )?(?:deel)?${kw.area} ${list}(?: en (?:de )?${kw.area} ${list})?`,
                'giu',
            ),
            null,
        )
        // "het gedeelte van het grondgebied van de stad Gent …", "de deelgemeenten X en Y van de stad Aalst"
        take(new RegExp(`deelgemeenten? [^;]*? van de ${kw.area} (${NAME})`, 'giu'), partial)
        // "het (ge)deel(te) van het grondgebied van de stad", "heel het grondgebied van de stad … gelegen tussen"
        take(new RegExp(`grondgebied van de (?:vroegere )?${kw.area} (${NAME})`, 'giu'), partial)
    } else {
        take(
            new RegExp(
                `(?:limites?(?: nord| sud| est| ouest)?|frontieres?|ligne de separation) (?:avec|de|des|entre) (?:la |les )?(?:ancienne |anciennes )?${kw.area} ${list}(?: et (?:la |les )?${kw.area} ${list})?`,
                'giu',
            ),
            null,
        )
        take(
            new RegExp(`anciennes? communes? [^;]*? de la ${kw.area} ${kw.of}(${NAME})`, 'giu'),
            partial,
        )
        take(
            new RegExp(`territoire de (?:la|l'ancienne) ${kw.area} ${kw.of}(${NAME})`, 'giu'),
            partial,
        )
    }
    // What's left are whole municipalities, as long as they're introduced as such
    const whole = new Set<string>()
    for (const m of rest.matchAll(new RegExp(`${kw.area} ${list}`, 'giu'))) {
        for (const r of nameIn(m[0])) whole.add(r)
    }
    // "De steden Bastenaken en Houffalize, de deelgemeente Bertogne van de stad Bastenaken": all of it
    for (const r of whole) partial.delete(r)
    for (const r of boundaryOnly[`${item.section}.${item.index}`] ?? []) whole.delete(r)
    return { name: (name ?? seat).trim(), number, seat: seat.trim(), territory, whole, partial }
}

// ---------------------------------------------------------------------------------------------

const municipalities = await fetchMunicipalities()
const nlBody = await fetchAnnex('nl')
await new Promise((r) => setTimeout(r, 2000))
const frBody = await fetchAnnex('fr')
await new Promise((r) => setTimeout(r, 2000))
const consolidatedTo = await fetchConsolidatedTo()

const nlItems = splitItems(nlBody, 'nl')
const frItems = splitItems(frBody, 'fr')
if (nlItems.length !== frItems.length)
    throw new Error(`nl has ${nlItems.length} cantons, fr ${frItems.length}`)

const errors: string[] = []
const cantons = nlItems.map((nlItem, i) => {
    const frItem = must(frItems[i], `French item ${i}`)
    const ref = `${nlItem.section}.${nlItem.index}`
    if (frItem.section !== nlItem.section || frItem.index !== nlItem.index)
        throw new Error(`Misaligned at ${ref}`)
    let nl: ParsedCanton, fr: ParsedCanton
    try {
        nl = parseItem(nlItem, 'nl', municipalities)
        fr = parseItem(frItem, 'fr', municipalities)
    } catch (e) {
        errors.push((e as Error).message)
        return null
    }
    const same = (a: Set<string>, b: Set<string>) =>
        a.size === b.size && [...a].every((x) => b.has(x))
    if (!same(nl.whole, fr.whole) || !same(nl.partial, fr.partial)) {
        errors.push(
            `${ref}: nl and fr disagree (nl whole ${[...nl.whole].join(',')} partial ${[...nl.partial].join(',')}; fr whole ${[...fr.whole].join(',')} partial ${[...fr.partial].join(',')})`,
        )
    }
    if (nl.number !== fr.number)
        errors.push(`${ref}: canton number nl ${nl.number}, fr ${fr.number}`)
    if (nl.whole.size + nl.partial.size === 0) errors.push(`${ref}: no municipalities found`)
    const arrondissement = arrondissementOf(nlItem.section, nl.name)
    // Ids follow the local language; the Dutch text uses the German names around Eupen
    const french = sectionOf(nlItem.section).french && arrondissement !== 'eupen'
    const id = toId(french ? fr.name : nl.name, nl.number)
    const german = germanCantonNames[id]
    return {
        id,
        arrondissement,
        name: { nl: nl.name, fr: fr.name, ...(german ? { de: german.name } : {}) },
        ...(nl.number ? { number: nl.number } : {}),
        seat: { nl: nl.seat, fr: fr.seat },
        municipalities: [
            ...[...nl.whole].map((municipality): { municipality: string; partial?: boolean } => ({
                municipality,
            })),
            ...[...nl.partial].map((municipality) => ({ municipality, partial: true })),
        ].sort((a, b) => a.municipality.localeCompare(b.municipality)),
        territory: { nl: nl.territory, fr: fr.territory },
        legalBasis: { url: ANNEX_ELI, provision: `Bijvoegsel art. 1, afdeling ${ref}` },
        ...(german ? { sources: german.sources } : {}),
    }
})

// Every municipality lies wholly in one canton, or is split over several
const parsed = cantons.filter((c) => c !== null)
const coverage = new Map<string, { whole: string[]; partial: string[] }>()
for (const c of parsed) {
    for (const m of c.municipalities) {
        const e = coverage.get(m.municipality) ?? { whole: [], partial: [] }
        ;(m.partial ? e.partial : e.whole).push(c.id)
        coverage.set(m.municipality, e)
    }
}
for (const mu of municipalities) {
    const e = coverage.get(mu.refnis)
    const label = `${mu.name.nl} (${mu.refnis})`
    if (!e) errors.push(`${label} is in no canton`)
    else if (e.whole.length > 1) errors.push(`${label} is wholly in ${e.whole.join(', ')}`)
    else if (e.whole.length === 1 && e.partial.length)
        errors.push(`${label} is wholly in ${e.whole[0]} and partly in ${e.partial.join(', ')}`)
    else if (e.whole.length === 0 && e.partial.length < 2)
        errors.push(`${label} is only partly covered, by ${e.partial.join(', ')}`)
}
const ids = parsed.map((c) => c.id)
for (const id of Object.keys(germanCantonNames))
    if (!ids.includes(id)) errors.push(`German name for unknown canton ${id}`)
for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) errors.push(`Duplicate id ${id}`)

if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
}

const write = (file: string, data: unknown) => {
    writeFileSync(new URL(`../data/${file}`, import.meta.url), JSON.stringify(data, null, 2) + '\n')
}
write(
    'municipalities.json',
    municipalities.map(({ refnis, name, province, region }) => ({
        id: refnis,
        name,
        province,
        region,
    })),
)
write('cantons.json', parsed)
writeFileSync(
    new URL('parse/annex-version.json', import.meta.url),
    JSON.stringify({ eli: ANNEX_ELI, consolidatedTo }, null, 4) + '\n',
)
console.log(
    `${parsed.length} cantons, ${municipalities.length} municipalities, from the annex as updated to ${consolidatedTo}`,
)
