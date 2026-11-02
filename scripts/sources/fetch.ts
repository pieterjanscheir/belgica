/**
 * Fetches the official sources into snapshot directories (see store.ts).
 *
 *     node scripts/sources/fetch.ts [source…]     # all sources when none are named
 *
 * Writes to $SOURCES_DIR, or .sources/ by default. The scheduled `sources` workflow runs this
 * and commits the snapshots to the `sources` branch. Exits non-zero when a page failed (its last
 * good snapshot is kept) or a walk was interrupted (the source's snapshots are left as they
 * were); the workflow then rebuilds the data from the rest and reports the failure. A part of a
 * source that can't be read for now keeps its last snapshots without failing the run, and says
 * so ("kept the last snapshots").
 */
import { type Source, sources } from './catalog.ts'
import { get } from './http.ts'
import { Store } from './store.ts'

const root = process.env['SOURCES_DIR'] ?? '.sources'
const wanted = process.argv.slice(2)
const unknown = wanted.filter((name) => !sources.some((s) => s.name === name))
if (unknown.length > 0) throw new Error(`Unknown source: ${unknown.join(', ')}`)

/** Walks one source into its snapshots; false when a page failed or the walk broke off */
async function walk(source: Source): Promise<boolean> {
    const store = new Store(root, source.name)
    const count = { changed: 0, unchanged: 0, failed: 0 }
    try {
        await source.fetch(
            async (url) => {
                const res = await get(url)
                const result = store.put(url, res)
                count[result]++
                if (result === 'failed') console.error(`${source.name}: HTTP ${res.status} ${url}`)
                return res
            },
            (prefix, reason) => {
                const kept = store.keep(prefix)
                console.log(
                    `${source.name}: kept the last snapshots of ${kept} pages under ${prefix}: ${reason}`,
                )
                return kept
            },
        )
    } catch (error) {
        // An interrupted walk keeps the previous index whole, rather than drop what it missed
        console.error(`${source.name}: ${String(error)}; snapshots left as they were`)
        return false
    }
    // Failed pages keep their last good snapshot, and nothing is pruned: a failed list page
    // would make every page it links to look removed. The run fails, so a person looks.
    store.save({ prune: count.failed === 0 })
    console.log(
        `${source.name}: ${count.changed} changed, ${count.unchanged} unchanged, ${count.failed} failed`,
    )
    return count.failed === 0
}

// The sources are on different sites, so they're walked side by side; http.ts still sends
// one request per second to each site
const results = await Promise.all(
    sources.filter((s) => wanted.length === 0 || wanted.includes(s.name)).map(walk),
)
if (results.includes(false)) process.exitCode = 1
