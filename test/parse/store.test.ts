import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

import { fileFor, inside, Snapshots, Store } from '../../scripts/sources/store.ts'

const page = (main: string, extra = '') =>
    Buffer.from(`<html><body>${extra}<main>${main}</main></body></html>`)
const ok = (url: string, body: Buffer) => ({ url, status: 200, contentType: 'text/html', body })
const A = 'https://example.org/a'
const B = 'https://example.org/b'

let root: string
beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'snapshots-'))
})

/** One fetch run: the pages it got, then save */
function run(responses: [string, ReturnType<typeof ok>][], prune = true) {
    const store = new Store(root, 'test')
    const results = responses.map(([url, res]) => store.put(url, res))
    store.save({ prune })
    return results
}

describe('Store', () => {
    it('stores a page and finds it again', () => {
        expect(run([[A, ok(A, page('one'))]])).toEqual(['changed'])
        expect(new Snapshots(root, 'test').text(A)).toContain('one')
    })

    it('ignores volatile markup outside the main content, and keeps the first day it saw the content', () => {
        run([[A, ok(A, page('one', '<form>token 1</form>'))]])
        const first = new Snapshots(root, 'test').entry(A)?.retrieved
        expect(run([[A, ok(A, page('one', '<form>token 2</form>'))]])).toEqual(['unchanged'])
        expect(new Snapshots(root, 'test').entry(A)?.retrieved).toBe(first)
    })

    it('keeps the last good snapshot when a fetch fails, and records the failure', () => {
        run([[A, ok(A, page('good'))]])
        expect(run([[A, { ...ok(A, page('Service Unavailable')), status: 503 }]])).toEqual([
            'failed',
        ])
        const snapshots = new Snapshots(root, 'test')
        expect(snapshots.text(A)).toContain('good')
        expect(snapshots.entry(A)?.failure?.status).toBe(503)
    })

    it('drops pages a complete walk no longer reaches, with their files', () => {
        run([
            [A, ok(A, page('a'))],
            [B, ok(B, page('b'))],
        ])
        const file = join(root, 'test', new Snapshots(root, 'test').entry(B)?.file ?? '')
        expect(existsSync(file)).toBe(true)
        run([[A, ok(A, page('a'))]])
        expect(new Snapshots(root, 'test').entry(B)).toBeUndefined()
        expect(existsSync(file)).toBe(false)
    })

    it("keeps pages it didn't reach when told not to prune", () => {
        run([
            [A, ok(A, page('a'))],
            [B, ok(B, page('b'))],
        ])
        run([[A, ok(A, page('a'))]], false)
        expect(new Snapshots(root, 'test').text(B)).toContain('b')
    })

    it('keeps the last snapshots under a prefix, undoing what this run fetched there', () => {
        const C = 'https://example.org/c'
        run([
            [A, ok(A, page('a'))],
            [B, ok(B, page('b'))],
        ])
        const store = new Store(root, 'test')
        store.put(A, ok(A, page('a, changed')))
        store.put(B, ok(B, page('a maintenance page')))
        store.put(C, ok(C, page('new')))
        expect(store.keep('https://example.org/b')).toBe(1)
        expect(store.keep('https://example.org/c')).toBe(0)
        store.save({ prune: true })
        const snapshots = new Snapshots(root, 'test')
        expect(snapshots.text(A)).toContain('a, changed')
        expect(snapshots.text(B)).toContain('b')
        expect(snapshots.entry(C)).toBeUndefined()
    })

    it('reads the last good snapshot from before the run, not what the run fetched', () => {
        run([[A, ok(A, page('a'))]])
        const store = new Store(root, 'test')
        store.put(A, ok(A, page('a, changed')))
        expect(store.last(A)?.toString()).toContain('<main>a</main>')
        expect(store.last(B)).toBeUndefined()
    })

    it('keeps an untouched snapshot under a prefix when the walk fetches nothing there', () => {
        run([
            [A, ok(A, page('a'))],
            [B, ok(B, page('b'))],
        ])
        const store = new Store(root, 'test')
        store.put(A, ok(A, page('a')))
        expect(store.keep('https://example.org/b')).toBe(1)
        store.save({ prune: true })
        expect(new Snapshots(root, 'test').text(B)).toContain('b')
    })

    it("doesn't count a URL whose last snapshot is an error as kept", () => {
        run([[B, { ...ok(B, page('Not Found')), status: 404 }]])
        expect(new Store(root, 'test').keep('https://example.org/b')).toBe(0)
    })

    it('writes nothing until it saves, so an interrupted walk changes nothing', () => {
        run([[A, ok(A, page('old'))]])
        const index = readFileSync(join(root, 'test', 'index.json'), 'utf8')
        new Store(root, 'test').put(A, ok(A, page('new')))
        expect(new Snapshots(root, 'test').text(A)).toContain('old')
        expect(readFileSync(join(root, 'test', 'index.json'), 'utf8')).toBe(index)
    })
})

describe('fileFor', () => {
    it('names an ordinary page by its host and path', () => {
        expect(fileFor('https://example.org/nl/page?x=1', 'text/html')).toBe(
            'example.org/nl/page_x_1.html',
        )
    })

    it('stores a URL under its host, with the query folded into the name', () => {
        expect(fileFor('https://example.org/nl/a', 'text/html; charset=utf-8')).toBe(
            'example.org/nl/a.html',
        )
        expect(fileFor('https://example.org/nl/', 'text/html')).toBe('example.org/nl/index.html')
        expect(fileFor('https://example.org/files/a%20b.zip?v=2&x=1', 'application/zip')).toBe(
            'example.org/files/a_b.zip_v_2_x_1',
        )
        // The URL parser resolves these itself, inside the host
        expect(fileFor('https://example.org/nl/../../a', 'text/plain')).toBe('example.org/a')
        expect(fileFor('https://example.org/nl/%2e%2e/%2E%2E/a', 'text/plain')).toBe(
            'example.org/a',
        )
    })

    it.each([
        [
            'an encoded slash',
            'https://example.org/nl/x%2F..%2F..%2F..%2Fscripts%2Fparse%2Fbuild.ts',
        ],
        [
            'an encoded slash, in capitals or not',
            'https://example.org/nl/x%2f..%2f..%2f..%2f..%2fa',
        ],
        ['a path that ends in one', 'https://example.org/nl/x%2F..'],
        ['an encoded backslash', 'https://example.org/nl/x%5C..%5C..%5Ca'],
        ['a host that is no name', 'https://../a'],
    ])('refuses a path that leaves the host’s folder through %s', (_, url) => {
        expect(() => fileFor(url, 'text/plain')).toThrow(/leaves the host's folder/)
        // The message names the host, not the URL
        expect(() => fileFor(url, 'text/plain')).not.toThrow(/scripts|%2F|%5C|\/nl\//i)
    })

    it('refuses a path that needs a name longer than a file system takes', () => {
        const base = 'https://example.org/nl/'
        // 250 characters and '.html' fit; the query and the folders count too
        expect(fileFor(base + 'a'.repeat(250), 'text/html')).toHaveLength(
            'example.org/nl/'.length + 255,
        )
        for (const url of [
            base + 'a'.repeat(251),
            base + 'a'.repeat(256) + '/b',
            base + 'a?' + 'q'.repeat(254),
        ])
            expect(() => fileFor(url, 'text/html')).toThrow(/too long/)
    })
})

describe('snapshots stay inside their source’s directory', () => {
    const OUT = 'https://example.org/nl/x%2F..%2F..%2F..%2F..%2Fout'
    /** Everything under the temporary root, to see that nothing was written */
    const files = () => readdirSync(root, { recursive: true }).map(String).sort()

    it('holds a file to the directory', () => {
        expect(inside(join(root, 'test'), 'example.org/a.html')).toBe(
            join(root, 'test', 'example.org/a.html'),
        )
        for (const file of ['../out', 'example.org/../../out', '/etc/out', '..', ''])
            expect(() => inside(join(root, 'test'), file), file).toThrow(/outside/)
        // A neighbour whose name starts the same is outside too
        expect(() => inside(join(root, 'test'), '../test-other/a')).toThrow(/outside/)
    })

    it('refuses a URL whose file would be outside, and writes nothing', () => {
        const store = new Store(root, 'test')
        store.put(A, ok(A, page('a')))
        expect(() => store.put(OUT, ok(OUT, page('out')))).toThrow(/leaves the host's folder/)
        expect(files()).toEqual([])
    })

    /** An index, as a run before this one could have left it, that names `file` for B */
    function index(file: string) {
        run([
            [A, ok(A, page('a'))],
            [B, ok(B, page('b'))],
        ])
        const path = join(root, 'test', 'index.json')
        const index = JSON.parse(readFileSync(path, 'utf8')) as { entries: { file: string }[] }
        ;(index.entries[1] as { file: string }).file = file
        writeFileSync(path, JSON.stringify(index))
        mkdirSync(join(root, 'other'))
        writeFileSync(join(root, 'other', 'kept.txt'), 'kept')
    }

    it('refuses an index that names a file outside, to write, to prune or to read', () => {
        index('../other/kept.txt')
        expect(() => new Store(root, 'test')).toThrow(/outside/)
        expect(() => new Snapshots(root, 'test')).toThrow(/outside/)
        expect(readFileSync(join(root, 'other', 'kept.txt'), 'utf8')).toBe('kept')
    })
})

describe('Snapshots', () => {
    it('reads a path whose first segment only starts with two dots', () => {
        mkdirSync(join(root, 'test', '..foo'), { recursive: true })
        writeFileSync(join(root, 'test', '..foo', 'page.html'), 'content')
        writeFileSync(
            join(root, 'test', 'index.json'),
            JSON.stringify({
                source: 'test',
                entries: [
                    { url: A, status: 200, contentType: 'text/html', file: '..foo/page.html' },
                ],
            }),
        )
        expect(new Snapshots(root, 'test').text(A)).toBe('content')
    })

    it('refuses an index path that leaves the source directory', () => {
        mkdirSync(join(root, 'test'), { recursive: true })
        writeFileSync(
            join(root, 'test', 'index.json'),
            JSON.stringify({
                source: 'test',
                entries: [{ url: A, status: 200, contentType: 'text/html', file: '../../secret' }],
            }),
        )
        expect(() => new Snapshots(root, 'test').text(A)).toThrow(/outside/)
    })
})
