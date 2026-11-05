import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

import { zipEntry } from '../../scripts/parse/zip.ts'

/** A one-entry deflated archive, whose central directory claims `claimed` bytes unpacked */
function archive(name: string, data: Buffer, claimed = data.length): Buffer {
    const raw = deflateRawSync(data)
    const nameBytes = Buffer.from(name)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(raw.length, 18)
    local.writeUInt32LE(claimed, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(raw.length, 20)
    central.writeUInt32LE(claimed, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(0, 42)
    const centralOffset = local.length + nameBytes.length + raw.length
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    end.writeUInt16LE(1, 8)
    end.writeUInt16LE(1, 10)
    end.writeUInt32LE(central.length + nameBytes.length, 12)
    end.writeUInt32LE(centralOffset, 16)
    return Buffer.concat([local, nameBytes, raw, central, nameBytes, end])
}

describe('zipEntry', () => {
    it('reads a deflated entry', () => {
        const data = Buffer.from('a;b\n1;2\n')
        expect(zipEntry(archive('data.csv', data), /\.csv$/).toString()).toBe(data.toString())
    })

    it('refuses an entry that inflates to more than its directory says', () => {
        const bomb = archive('data.csv', Buffer.alloc(1024 * 1024), 100)
        expect(() => zipEntry(bomb, /\.csv$/)).toThrow()
    })
})
