/**
 * Reads a site's robots.txt the way RFC 9309 describes, for the one crawler belgica runs: which
 * paths it may fetch, and how long it should wait between requests (the non-standard but common
 * Crawl-delay).
 */

export interface Rule {
    allow: boolean
    /** The path pattern, with `*` for any characters and a trailing `$` for the end of the URL */
    pattern: string
}

export interface Robots {
    rules: Rule[]
    /** Seconds to wait between requests, when the site asks for it */
    crawlDelay?: number
}

/** Everything allowed: a robots.txt that's missing (4xx) or empty */
export const ALLOW_ALL: Robots = { rules: [] }
/** Nothing allowed: RFC 9309 has a crawler assume this when robots.txt can't be read (5xx) */
export const DISALLOW_ALL: Robots = { rules: [{ allow: false, pattern: '/' }] }

interface Group {
    agents: string[]
    rules: Rule[]
    crawlDelay?: number
}

/**
 * The rules for `agent` (a product token such as "belgica"): the groups that name it, or else
 * the `*` groups. Groups for the same agent are merged, as the RFC says.
 */
export function parseRobots(text: string, agent: string): Robots {
    const groups: Group[] = []
    let current: Group | undefined
    let inAgents = false
    for (const raw of text.split(/\r\n|\r|\n/)) {
        const line = raw.replace(/#.*$/, '').trim()
        const colon = line.indexOf(':')
        if (colon < 0) continue
        const key = line.slice(0, colon).trim().toLowerCase()
        const value = line.slice(colon + 1).trim()
        if (key === 'user-agent') {
            if (!inAgents || !current) {
                current = { agents: [], rules: [] }
                groups.push(current)
            }
            current.agents.push(value.toLowerCase())
            inAgents = true
            continue
        }
        if (key === 'sitemap') continue
        inAgents = false
        if (!current) continue
        if ((key === 'allow' || key === 'disallow') && value !== '')
            current.rules.push({ allow: key === 'allow', pattern: value })
        if (key === 'crawl-delay') {
            const seconds = Number(value)
            if (Number.isFinite(seconds) && seconds >= 0) current.crawlDelay = seconds
        }
    }
    const own = groups.filter((g) => g.agents.includes(agent.toLowerCase()))
    const chosen = own.length > 0 ? own : groups.filter((g) => g.agents.includes('*'))
    const delays = chosen.flatMap((g) => (g.crawlDelay === undefined ? [] : [g.crawlDelay]))
    return {
        rules: chosen.flatMap((g) => g.rules),
        ...(delays.length > 0 && { crawlDelay: Math.max(...delays) }),
    }
}

function matches(pattern: string, path: string): boolean {
    const anchored = pattern.endsWith('$')
    const body = anchored ? pattern.slice(0, -1) : pattern
    const regex = body
        .split('*')
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*')
    return new RegExp(`^${regex}${anchored ? '$' : ''}`).test(path)
}

/**
 * Whether a URL may be fetched: the longest matching rule wins, and Allow wins a tie. The
 * robots.txt itself is always allowed.
 */
export function isAllowed(robots: Robots, url: string): boolean {
    const { pathname, search } = new URL(url)
    if (pathname === '/robots.txt') return true
    const path = pathname + search
    let best: Rule | undefined
    for (const rule of robots.rules) {
        if (!matches(rule.pattern, path)) continue
        if (
            !best ||
            rule.pattern.length > best.pattern.length ||
            (rule.pattern.length === best.pattern.length && rule.allow)
        )
            best = rule
    }
    return best?.allow ?? true
}
