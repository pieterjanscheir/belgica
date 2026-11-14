/**
 * The id rule shared by the generators and the tests: lowercase ASCII words joined by hyphens,
 * taken from a name, with the number appended for places with several (`gent-1`).
 * See docs/guide/identifiers.md.
 */
export function toId(name: string, number?: number): string {
    const base = name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .join('-')
    return number === undefined ? base : `${base}-${number}`
}

/** Pattern every non-numeric id matches */
export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * The value, after checking it's an id: for the generators, which write ids into TypeScript
 * source and into file paths. The ids come from data built from scraped pages, so one with a
 * quote or a `../` must stop the build instead of ending up in code or outside data/.
 */
export function assertId(value: string, what = 'id'): string {
    // The value comes from parsed JSON, whatever its declared type: null or 12 isn't an id
    if (typeof value !== 'string' || !ID_PATTERN.test(value))
        throw new Error(`Not a valid ${what}: ${JSON.stringify(value)}`)
    return value
}
