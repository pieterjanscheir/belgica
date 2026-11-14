import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Source } from '../../scripts/sources/catalog.ts'
import type { Response } from '../../scripts/sources/http.ts'
import { Snapshots } from '../../scripts/sources/store.ts'
import { walk } from '../../scripts/sources/walk.ts'

const PAGE = 'https://example.org/a'

/** A source of one page */
const source = (name: string): Source => ({
    name,
    description: name,
    hosts: ['example.org'],
    async fetch(get) {
        await get(PAGE)
    },
})

/** A get that answers every URL with a page, and records what it was asked */
function site(status = 200) {
    const asked: [string, readonly string[]][] = []
    const get = (url: string, hosts: readonly string[]): Promise<Response> => {
        asked.push([url, hosts])
        return Promise.resolve({
            url,
            status,
            contentType: 'text/html',
            body: Buffer.from(`<main>${url}</main>`),
        })
    }
    return { get, asked }
}

let root: string
let errors: string[]
beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'walk-'))
    errors = []
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation((line: string) => {
        errors.push(line)
    })
})
afterEach(() => {
    vi.restoreAllMocks()
})

describe('walk', () => {
    it('saves what a source fetched, asked from the source’s own hosts', async () => {
        const { get, asked } = site()
        expect(await walk(source('one'), root, get)).toBe(true)
        expect(asked).toEqual([[PAGE, ['example.org']]])
        expect(new Snapshots(root, 'one').text(PAGE)).toContain(PAGE)
        expect(errors).toEqual([])
    })

    it('reports a failed page, and saves the rest', async () => {
        const { get } = site(404)
        expect(await walk(source('one'), root, get)).toBe(false)
        expect(errors).toEqual([`one: HTTP 404 ${PAGE}`])
        expect(new Snapshots(root, 'one').entry(PAGE)?.status).toBe(404)
    })

    it('leaves a source as it was when its walk breaks off', async () => {
        const { get } = site()
        await walk(source('one'), root, get)
        const index = readFileSync(join(root, 'one', 'index.json'), 'utf8')
        const broken: Source = {
            ...source('one'),
            async fetch(get) {
                await get(PAGE + '?changed')
                throw new Error('no list')
            },
        }
        expect(await walk(broken, root, get)).toBe(false)
        expect(errors).toEqual(['one: Error: no list; snapshots left as they were'])
        expect(readFileSync(join(root, 'one', 'index.json'), 'utf8')).toBe(index)
    })

    it('reports a source whose index names a file outside it, without fetching', async () => {
        mkdirSync(join(root, 'one'))
        writeFileSync(
            join(root, 'one', 'index.json'),
            JSON.stringify({ source: 'one', entries: [{ url: PAGE, file: '../two/index.json' }] }),
        )
        const { get, asked } = site()
        expect(await walk(source('one'), root, get)).toBe(false)
        expect(asked).toEqual([])
        expect(errors).toHaveLength(1)
        expect(errors[0]).toMatch(/^one: .*outside.*; snapshots left as they were$/)
    })

    it('still saves the other sources when one can’t be saved', async () => {
        // A file where the source's directory should be: nothing can be written under it
        writeFileSync(join(root, 'one'), '')
        const { get } = site()
        const results = await Promise.all(
            [source('one'), source('two')].map((s) => walk(s, root, get)),
        )
        expect(results).toEqual([false, true])
        expect(errors).toHaveLength(1)
        // The workflow lists the lines that say this as the run's failures
        expect(errors[0]).toMatch(/^one: couldn't be saved: .*snapshots left as they were$/)
        expect(existsSync(join(root, 'two', 'index.json'))).toBe(true)
        expect(new Snapshots(root, 'two').text(PAGE)).toContain(PAGE)
    })
})
