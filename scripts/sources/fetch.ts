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
 * so ("kept the last snapshots"). A source that can't be saved fails the run the same way, and the
 * others are still saved.
 */
import { sources } from './catalog.ts'
import { walk } from './walk.ts'

const root = process.env['SOURCES_DIR'] ?? '.sources'
const wanted = process.argv.slice(2)
const unknown = wanted.filter((name) => !sources.some((s) => s.name === name))
if (unknown.length > 0) throw new Error(`Unknown source: ${unknown.join(', ')}`)

// The sources are on different sites, so they're walked side by side; http.ts still sends
// one request per second to each site
const results = await Promise.all(
    sources
        .filter((s) => wanted.length === 0 || wanted.includes(s.name))
        .map((source) => walk(source, root)),
)
if (results.includes(false)) process.exitCode = 1
