/**
 * Reads one file out of a ZIP archive, as the sources publish their downloads: the central
 * directory at the end of the file names the entries, each of which is stored as is or
 * deflated. Enough for the official downloads (Statbel's CSVs, the NGI's GeoPackage); no
 * encryption, no ZIP64.
 */
import { inflateRawSync } from 'node:zlib'

const END_OF_CENTRAL_DIRECTORY = 0x06054b50
const CENTRAL_FILE_HEADER = 0x02014b50
const LOCAL_FILE_HEADER = 0x04034b50
/**
 * The most an entry may unpack to. The largest, the NGI's GeoPackage, is well under this; a
 * crafted archive that claims or inflates to more is refused rather than filling memory.
 */
export const MAX_ENTRY_BYTES = 1024 * 1024 * 1024

export interface ZipEntry {
    name: string
    data: () => Buffer
}

/** The entries of an archive, in the order of its central directory */
export function zipEntries(archive: Buffer): ZipEntry[] {
    // The end record is the last thing in the file, after a comment of up to 65535 bytes
    let end = -1
    for (let i = archive.length - 22; i >= Math.max(0, archive.length - 22 - 0xffff); i--) {
        if (archive.readUInt32LE(i) === END_OF_CENTRAL_DIRECTORY) {
            end = i
            break
        }
    }
    if (end < 0) throw new Error('Not a ZIP archive: no end of central directory')
    const count = archive.readUInt16LE(end + 10)
    let offset = archive.readUInt32LE(end + 16)
    const entries: ZipEntry[] = []
    for (let i = 0; i < count; i++) {
        if (archive.readUInt32LE(offset) !== CENTRAL_FILE_HEADER)
            throw new Error(`ZIP archive: bad central directory entry at ${offset}`)
        const method = archive.readUInt16LE(offset + 10)
        const compressed = archive.readUInt32LE(offset + 20)
        const size = archive.readUInt32LE(offset + 24)
        const nameLength = archive.readUInt16LE(offset + 28)
        const extraLength = archive.readUInt16LE(offset + 30)
        const commentLength = archive.readUInt16LE(offset + 32)
        const local = archive.readUInt32LE(offset + 42)
        const name = archive.toString('utf8', offset + 46, offset + 46 + nameLength)
        entries.push({
            name,
            data: () => {
                if (archive.readUInt32LE(local) !== LOCAL_FILE_HEADER)
                    throw new Error(`ZIP archive: bad local header for ${name}`)
                const start =
                    local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28)
                if (start + compressed > archive.length)
                    throw new Error(`ZIP archive: ${name} runs past the end of the archive`)
                if (size > MAX_ENTRY_BYTES)
                    throw new Error(`ZIP archive: ${name} is larger than ${MAX_ENTRY_BYTES} bytes`)
                const raw = archive.subarray(start, start + compressed)
                if (method === 0) return Buffer.from(raw)
                // Never more than the size the directory gives: a lying header fails here
                // instead of inflating without end
                if (method === 8) return inflateRawSync(raw, { maxOutputLength: Math.max(size, 1) })
                throw new Error(`ZIP archive: unsupported compression method ${method} for ${name}`)
            },
        })
        offset += 46 + nameLength + extraLength + commentLength
    }
    return entries
}

/** The one entry whose name matches, or an error naming what the archive holds instead */
export function zipEntry(archive: Buffer, name: RegExp): Buffer {
    const entries = zipEntries(archive)
    const found = entries.filter((e) => name.test(e.name))
    if (found.length !== 1) {
        throw new Error(
            `ZIP archive: expected one entry matching ${name}, found ${found.length} among ` +
                entries.map((e) => e.name).join(', '),
        )
    }
    return found[0]?.data() ?? Buffer.alloc(0)
}
