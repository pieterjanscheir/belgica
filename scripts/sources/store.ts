/**
 * Snapshots of the official sources, one directory per source:
 *
 *     <root>/<source>/index.json         what was fetched, when, and a content hash
 *     <root>/<source>/<host>/<path>      the response body, as received
 *
 * A page is only rewritten when its content changes. Pages carry volatile markup (session
 * tokens, generated element ids), so the hash is taken over the normalized main content: a
 * fetch that finds the same content leaves the snapshot, and its `retrieved` date, as they were.
 *
 * A failed fetch (an error status) never replaces a good snapshot: the entry keeps it and
 * records the failure, and the fetch reports it. A page a complete, successful walk no longer
 * reaches is dropped from the index, with its file, so the parsers only see what the source
 * still lists. Nothing is written until `save`, so an interrupted walk changes nothing.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface Entry {
    url: string
    /** The URL after redirects, when different */
    finalUrl?: string
    status: number
    contentType: string
    /** Path of the snapshot, relative to the source's directory */
    file: string
    /** SHA-256 of the normalized content */
    sha256: string
    /** When this content was first fetched (ISO date) */
    retrieved: string
    /** When the URL was last fetched (ISO date) */
    checked: string
    /** The last fetch failed: the snapshot is from `retrieved`, not from `checked` */
    failure?: { status: number; checked: string }
}

/** What a fetch did to a URL's snapshot */
export type PutResult = 'changed' | 'unchanged' | 'failed'

export interface Index {
    source: string
    entries: Entry[]
}

/** The file a URL is stored in: host and path, with the query folded into the name */
export function fileFor(url: string, contentType: string): string {
    const u = new URL(url)
    let path = decodeURIComponent(u.pathname).replace(/\/$/, '/index')
    if (u.search) path += '_' + u.search.slice(1).replace(/[^\w.-]+/g, '_')
    path = path.replace(/[^\w./-]+/g, '_')
    const ext = contentType.includes('html') ? '.html' : ''
    return join(u.host, path.endsWith(ext) ? path : path + ext)
}

/** Main content without volatile markup, for change detection */
export function normalize(body: Buffer, contentType: string): Buffer {
    if (!contentType.includes('html')) return body
    const html = body.toString('utf8')
    const main = /<main\b[\s\S]*<\/main>/i.exec(html)?.[0] ?? html
    return Buffer.from(
        main
            .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '')
            .replace(/\s(?:class|id)="[^"]*(?:js-view-dom-id|form-build-id|token)[^"]*"/g, '')
            .replace(/\sname="form_build_id" value="[^"]*"/g, '')
            .replace(/\s+/g, ' '),
    )
}

export class Store {
    readonly #dir: string
    readonly #index: Index
    readonly #byUrl = new Map<string, Entry>()
    /** The index as this run found it, for keep() */
    readonly #previous = new Map<string, Entry>()
    readonly #seen = new Set<string>()
    readonly #pending = new Map<string, Buffer>()
    readonly #today = new Date().toISOString().slice(0, 10)

    constructor(root: string, source: string) {
        this.#dir = join(root, source)
        const path = join(this.#dir, 'index.json')
        this.#index =
            existsSync(path) ?
                (JSON.parse(readFileSync(path, 'utf8')) as Index)
            :   { source, entries: [] }
        for (const entry of this.#index.entries) {
            this.#byUrl.set(entry.url, entry)
            this.#previous.set(entry.url, entry)
        }
    }

    /**
     * Keeps the last snapshots of every URL under `prefix` as they were, undoing what this run
     * fetched there: for a part of a source that can't be read for now, so its records stay
     * as they were instead of being retired. Returns how many snapshots were kept.
     */
    keep(prefix: string): number {
        let kept = 0
        for (const [url, entry] of [...this.#byUrl]) {
            if (!url.startsWith(prefix)) continue
            this.#pending.delete(entry.file)
            const previous = this.#previous.get(url)
            if (previous) {
                this.#byUrl.set(url, previous)
                this.#seen.add(url)
                kept++
            } else {
                this.#byUrl.delete(url)
                this.#seen.delete(url)
            }
        }
        return kept
    }

    /** Records a response */
    put(
        url: string,
        res: { url: string; status: number; contentType: string; body: Buffer },
    ): PutResult {
        this.#seen.add(url)
        const previous = this.#byUrl.get(url)
        if (res.status !== 200 && previous?.status === 200) {
            this.#byUrl.set(url, {
                ...previous,
                failure: { status: res.status, checked: this.#today },
            })
            return 'failed'
        }
        const sha256 = createHash('sha256')
            .update(normalize(res.body, res.contentType))
            .digest('hex')
        const changed = previous?.sha256 !== sha256 || previous.status !== res.status
        const file = previous?.file ?? fileFor(url, res.contentType)
        if (changed) this.#pending.set(file, res.body)
        this.#byUrl.set(url, {
            url,
            ...(res.url === url ? {} : { finalUrl: res.url }),
            status: res.status,
            contentType: res.contentType,
            file,
            sha256,
            retrieved: changed ? this.#today : previous.retrieved,
            checked: this.#today,
        })
        if (res.status !== 200) return 'failed'
        return changed ? 'changed' : 'unchanged'
    }

    /**
     * Writes the snapshots and the index. With `prune`, URLs this run didn't reach are dropped,
     * with their files: only after a complete walk in which nothing failed, since a failed list
     * page hides every page it links to.
     */
    save({ prune }: { prune: boolean }): void {
        mkdirSync(this.#dir, { recursive: true })
        for (const [file, body] of this.#pending) {
            mkdirSync(dirname(join(this.#dir, file)), { recursive: true })
            writeFileSync(join(this.#dir, file), body)
        }
        const entries = [...this.#byUrl.values()]
            .filter((e) => !prune || this.#seen.has(e.url))
            .sort((a, b) => a.url.localeCompare(b.url))
        const kept = new Set(entries.map((e) => e.file))
        for (const e of this.#byUrl.values())
            if (prune && !this.#seen.has(e.url) && !kept.has(e.file))
                rmSync(join(this.#dir, e.file), { force: true })
        writeFileSync(
            join(this.#dir, 'index.json'),
            JSON.stringify({ source: this.#index.source, entries }, null, 4) + '\n',
        )
    }
}

/** Reads snapshots back, for the parsers */
export class Snapshots {
    readonly #dir: string
    readonly #byUrl: Map<string, Entry>

    constructor(root: string, source: string) {
        this.#dir = join(root, source)
        const index = JSON.parse(readFileSync(join(this.#dir, 'index.json'), 'utf8')) as Index
        this.#byUrl = new Map(index.entries.map((e) => [e.url, e]))
    }

    entries(): Entry[] {
        return [...this.#byUrl.values()]
    }

    entry(url: string): Entry | undefined {
        return this.#byUrl.get(url)
    }

    /** The body of a successfully fetched URL */
    text(url: string): string | undefined {
        const entry = this.#byUrl.get(url)
        if (entry?.status !== 200) return undefined
        return readFileSync(join(this.#dir, entry.file), 'utf8')
    }

    path(url: string): string | undefined {
        const entry = this.#byUrl.get(url)
        return entry?.status === 200 ? join(this.#dir, entry.file) : undefined
    }
}
