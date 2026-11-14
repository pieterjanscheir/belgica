/**
 * Walks one source into its snapshots (see store.ts), for fetch.ts. A source that fails, while
 * it's read, fetched or saved, is reported and leaves the other sources to their own walks.
 */
import type { Source } from './catalog.ts'
import { get as httpGet } from './http.ts'
import { Store } from './store.ts'

/** Walks one source into its snapshots under `root`; false when a page failed or the walk broke off */
export async function walk(source: Source, root: string, get = httpGet): Promise<boolean> {
    const count = { changed: 0, unchanged: 0, failed: 0 }
    let store: Store
    try {
        store = new Store(root, source.name)
        await source.fetch(
            async (url) => {
                const res = await get(url, source.hosts)
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
    try {
        // Failed pages keep their last good snapshot, and nothing is pruned: a failed list page
        // would make every page it links to look removed. The run fails, so a person looks.
        store.save({ prune: count.failed === 0 })
    } catch (error) {
        // The index is written last, so it still describes the last run that was saved whole.
        // The other sources are walked side by side, and keep their own run.
        console.error(
            `${source.name}: couldn't be saved: ${String(error)}; index and unsaved snapshots left as they were`,
        )
        return false
    }
    console.log(
        `${source.name}: ${count.changed} changed, ${count.unchanged} unchanged, ${count.failed} failed`,
    )
    return count.failed === 0
}
