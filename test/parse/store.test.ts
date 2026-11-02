import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

import { Snapshots, Store } from '../../scripts/sources/store.ts'

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

    it('writes nothing until it saves, so an interrupted walk changes nothing', () => {
        run([[A, ok(A, page('old'))]])
        const index = readFileSync(join(root, 'test', 'index.json'), 'utf8')
        new Store(root, 'test').put(A, ok(A, page('new')))
        expect(new Snapshots(root, 'test').text(A)).toContain('old')
        expect(readFileSync(join(root, 'test', 'index.json'), 'utf8')).toBe(index)
    })
})
