/**
 * Reads the opening hours the courts publish as free text ("De griffie is elke werkdag open van
 * 8u30 tot 12u30 en van 13u30 tot 16u00.") into OpenStreetMap `opening_hours` syntax
 * ("Mo-Fr 08:30-12:30,13:30-16:00").
 *
 * Conservative by design: every word must be understood. Text with anything else in it (a
 * temporary closure, a note about hearings, "OPGELET: …") gives `undefined`, and the record
 * keeps only the published text. A wrong opening hour is worse than none.
 */
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

const DAY_NAMES: Record<string, number> = {}
for (const [i, names] of [
    ['maandag', 'lundi', 'montag', 'ma'],
    ['dinsdag', 'mardi', 'dienstag', 'di'],
    ['woensdag', 'mercredi', 'mittwoch', 'wo'],
    ['donderdag', 'jeudi', 'donnerstag', 'do'],
    ['vrijdag', 'vendredi', 'freitag', 'vr'],
    ['zaterdag', 'samedi', 'samstag', 'za'],
    ['zondag', 'dimanche', 'sonntag', 'zo'],
].entries()) {
    for (const name of names) DAY_NAMES[name] = i
}

const WORKDAYS =
    /\b(?:elke werkdag|alle werkdagen|op werkdagen|werkdagen|tous les jours ouvrables|chaque jour ouvrable|les jours ouvrables|jours ouvrables|an werktagen|werktags)\b/g

// Words that carry no meaning for the schedule
const FILLER = new Set([
    'de',
    'griffie',
    'is',
    'zijn',
    'open',
    'geopend',
    'openingsuren',
    'openingstijden',
    'van',
    'telkens',
    'uur',
    'u',
    'le',
    'greffe',
    'est',
    'ouvert',
    'heures',
    'horaires',
    'du',
    'die',
    'kanzlei',
    'ist',
    'geöffnet',
    'öffnungszeiten',
    'von',
    'uhr',
    'h',
    'et',
    'en',
    'und',
])

type Token =
    | { kind: 'day'; day: number }
    | { kind: 'time'; minutes: number }
    | { kind: 'to' }
    | { kind: 'closed'; part: 'afternoon' | 'day' }
    | { kind: 'sep' }

function tokenize(text: string): Token[] | undefined {
    const s = text
        .toLowerCase()
        .replace(/[–—-]/g, ' - ')
        .replace(WORKDAYS, ' @workdays ')
        // The dashes are spaced out above, so "après-midi" reads "après - midi". `\b` doesn't
        // see the é of "fermé" as part of a word; a lookahead for a letter does.
        .replace(
            /\b(?:namiddag|middag|'s middags|après - midi|nachmittags?)\s+(?:gesloten|fermé|geschlossen)(?!\p{L})/gu,
            ' @afternoonclosed ',
        )
        .replace(/\b(?:gesloten|fermé|geschlossen)(?!\p{L})/gu, ' @closed ')
        .replace(
            /(\d{1,2})\s*(?:[u:h.]\s*(\d{2}))?(?:\s*(?:heures|uhr|uur|u|h)\b)?(?!\d)/g,
            (_, h: string, m?: string) => ` @t${h}_${m ?? '00'} `,
        )
    const tokens: Token[] = []
    for (const word of s.split(/[\s,;:|/]+|(?<=\S)(?=\.)|\.(?=\s|$)/).filter(Boolean)) {
        if (word === '@workdays') {
            tokens.push({ kind: 'day', day: 0 }, { kind: 'to' }, { kind: 'day', day: 4 })
        } else if (word === '@closed' || word === '@afternoonclosed') {
            tokens.push({ kind: 'closed', part: word === '@closed' ? 'day' : 'afternoon' })
        } else if (word.startsWith('@t')) {
            const [h = 0, m = 0] = word.slice(2).split('_').map(Number)
            if (h > 23 || m > 59) return undefined
            tokens.push({ kind: 'time', minutes: h * 60 + m })
        } else if (word in DAY_NAMES) {
            tokens.push({ kind: 'day', day: DAY_NAMES[word] ?? 0 })
        } else if (['tot', '-', 'à', 'au', 'bis', 't/m', 'tem'].includes(word)) {
            tokens.push({ kind: 'to' })
        } else if (word === '.') {
            tokens.push({ kind: 'sep' })
        } else if (!FILLER.has(word)) {
            return undefined
        }
    }
    return tokens
}

const hhmm = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function toOpeningHours(text: string): string | undefined {
    const tokens = tokenize(text)
    if (!tokens) return undefined
    const schedule = new Map<number, string[]>()
    let days: number[] = []
    let daysClosed = false // a new day list starts once times follow the previous one
    let hasHours = false // the current day list has hours
    // Days a finished day list described. A day described twice ("Monday to Friday 9 to 16.
    // Wednesday 9 to 12", "… Wednesday closed") means the text corrects itself; rather than
    // decide which part wins, give up.
    const described = new Set<number>()
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (!t) break
        if (t.kind === 'sep') continue
        if (t.kind === 'day') {
            if (daysClosed) {
                for (const d of days) described.add(d)
                days = []
                daysClosed = false
                hasHours = false
            }
            const next = tokens[i + 1]
            const end = tokens[i + 2]
            const listed: number[] = []
            if (next?.kind === 'to' && end?.kind === 'day') {
                if (end.day < t.day) return undefined
                for (let d = t.day; d <= end.day; d++) listed.push(d)
                i += 2
            } else {
                listed.push(t.day)
            }
            if (listed.some((d) => described.has(d))) return undefined
            days.push(...listed)
        } else if (t.kind === 'time') {
            const to = tokens[i + 1]
            const end = tokens[i + 2]
            if (to?.kind !== 'to' || end?.kind !== 'time' || end.minutes <= t.minutes)
                return undefined
            if (days.length === 0 || t.minutes < 6 * 60 || end.minutes > 20 * 60) return undefined
            for (const d of days)
                schedule.set(d, [
                    ...(schedule.get(d) ?? []),
                    `${hhmm(t.minutes)}-${hhmm(end.minutes)}`,
                ])
            daysClosed = true
            hasHours = true
            i += 2
        } else if (t.kind === 'to') {
            // A dash between parts ("van 9 tot 12.30 – namiddag gesloten") only separates them
            continue
        } else {
            // "Afternoon closed" only completes hours given for the morning; "closed" only goes
            // with days that have no hours
            if (days.length === 0 || (t.part === 'afternoon') !== hasHours) return undefined
            daysClosed = true
        }
    }
    if (schedule.size === 0) return undefined

    // Group days with the same hours, and write consecutive days as a range: Mo-Fr, Mo,Th
    const groups = new Map<string, number[]>()
    for (const [day, ranges] of [...schedule].sort(([a], [b]) => a - b)) {
        const key = [...ranges].sort().join(',')
        groups.set(key, [...(groups.get(key) ?? []), day])
    }
    const rules: string[] = []
    for (const [ranges, days] of groups) {
        const parts: string[] = []
        for (let i = 0; i < days.length;) {
            let j = i
            while (days[j + 1] === (days[j] ?? 0) + 1) j++
            const from = DAYS[days[i] ?? 0]
            const to = DAYS[days[j] ?? 0]
            parts.push(
                j - i >= 2 ?
                    `${from}-${to}`
                :   days
                        .slice(i, j + 1)
                        .map((d) => DAYS[d])
                        .join(','),
            )
            i = j + 1
        }
        rules.push(`${parts.join(',')} ${ranges}`)
    }
    return rules.join('; ')
}
