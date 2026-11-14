// The site is served under SITE_BASE; fetch() doesn't add the basePath the way <Link> does
const base = process.env.NEXT_PUBLIC_SITE_BASE ?? ''
const cache = new Map<string, Promise<unknown>>()

/** A JSON file of the site, fetched once per page load and shared by every caller */
export function fetchJson<T>(path: string): Promise<T> {
    // Only a path on this site: `//host/…` or `https://…` would fetch from somewhere else
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\'))
        return Promise.reject(new Error(`Not a path on this site: ${path}`))
    let promise = cache.get(path)
    if (!promise) {
        promise = fetch(`${base}${path}`).then((r) => {
            if (!r.ok) throw new Error(`${path}: ${r.status}`)
            return r.json()
        })
        // A failed request isn't kept, so the next caller tries again
        promise.catch(() => {
            cache.delete(path)
        })
        cache.set(path, promise)
    }
    return promise as Promise<T>
}
