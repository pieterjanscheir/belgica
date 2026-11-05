import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

import { zipEntries, zipEntry } from '../../scripts/parse/zip.ts'
import { assertPublicUrl } from '../../scripts/sources/http.ts'
import { Snapshots, fileFor, within } from '../../scripts/sources/store.ts'

describe('snapshot paths', () => {
    it('keeps encoded dot segments under the host', () => {
        const file = fileFor('https://example.org/a/%2e%2e/%2e%2e/%2e%2e/etc/passwd', 'text/plain')
        expect(file.startsWith('example.org/')).toBe(true)
        expect(file.split('/')).not.toContain('..')
    })

    it('refuses a path outside the directory', () => {
        expect(() => within('/tmp/x', '../y')).toThrow(/outside/)
        expect(() => within('/tmp/x', '/etc/passwd')).toThrow(/outside/)
        expect(within('/tmp/x', 'a/b')).toBe('/tmp/x/a/b')
    })

    it("doesn't read a file index.json points outside the source", () => {
        const root = mkdtempSync(join(tmpdir(), 'snapshots-'))
        mkdirSync(join(root, 's'))
        writeFileSync(
            join(root, 's', 'index.json'),
            JSON.stringify({
                source: 's',
                entries: [{ url: 'https://example.org/', status: 200, file: '../../secret' }],
            }),
        )
        const snapshots = new Snapshots(root, 's')
        expect(() => snapshots.text('https://example.org/')).toThrow(/outside/)
    })
})

describe('assertPublicUrl', () => {
    it.each([
        'file:///etc/passwd',
        'http://localhost/',
        'http://127.0.0.1/',
        'http://10.0.0.1/',
        'http://169.254.169.254/latest/meta-data/',
        'http://192.168.1.1/',
        'http://172.16.0.1/',
        'http://[::1]/',
        'http://[fd00::1]/',
        'http://intranet/',
        'https://user:pass@example.org/',
    ])('refuses %s', (url) => {
        expect(() => assertPublicUrl(url)).toThrow()
    })

    it('allows the public sources', () => {
        expect(assertPublicUrl('https://statbel.fgov.be/nl').host).toBe('statbel.fgov.be')
    })
})

/** A one-entry archive */
function zip(name: string, data: Buffer, uncompressed = data.length): Buffer {
    const raw = deflateRawSync(data)
    const n = Buffer.from(name)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(n.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(raw.length, 20)
    central.writeUInt32LE(uncompressed, 24)
    central.writeUInt16LE(n.length, 28)
    central.writeUInt32LE(0, 42)
    const cdOffset = 30 + n.length + raw.length
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    end.writeUInt16LE(1, 10)
    end.writeUInt32LE(cdOffset, 16)
    return Buffer.concat([local, n, raw, central, n, end])
}

describe('zip', () => {
    it('reads an entry', () => {
        expect(zipEntry(zip('a.csv', Buffer.from('x,y')), /\.csv$/).toString()).toBe('x,y')
    })

    it('refuses an entry that declares more than the limit', () => {
        expect(() => zipEntry(zip('a.csv', Buffer.from('x'), 0xffffffff), /\.csv$/)).toThrow(
            /larger than/,
        )
    })

    it('refuses a truncated archive', () => {
        const archive = zip('a.csv', Buffer.from('x,y'))
        archive.writeUInt32LE(archive.length, archive.length - 6)
        expect(() => zipEntries(archive)).toThrow(/past the end/)
    })
})
