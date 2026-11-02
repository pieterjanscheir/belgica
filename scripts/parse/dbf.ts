/**
 * Reads a dBASE table (.dbf), the attribute table of a shapefile: a 32-byte header with the
 * record count, header length and record length, a 32-byte descriptor per field, then fixed-width
 * records whose first byte is '*' when the record is deleted. Every value comes back as trimmed
 * text, decoded as UTF-8 (what the shapefile's .cpg declares for the files read here).
 */

/** The records of a .dbf file, as `{ field: value }` with every value as trimmed text */
export function readDbf(file: Buffer): Record<string, string>[] {
    const count = file.readUInt32LE(4)
    const headerLength = file.readUInt16LE(8)
    const recordLength = file.readUInt16LE(10)
    const fields: { name: string; length: number }[] = []
    for (let offset = 32; file[offset] !== 0x0d; offset += 32) {
        if (offset + 32 > headerLength) throw new Error('dbf: no end to the field descriptors')
        const name = file.toString('latin1', offset, offset + 11).replace(/\0.*$/s, '')
        fields.push({ name, length: file[offset + 16] ?? 0 })
    }
    const records: Record<string, string>[] = []
    for (let i = 0; i < count; i++) {
        const start = headerLength + i * recordLength
        if (file[start] === 0x2a) continue
        let position = start + 1
        const record: Record<string, string> = {}
        for (const { name, length } of fields) {
            record[name] = file.toString('utf8', position, position + length).trim()
            position += length
        }
        records.push(record)
    }
    return records
}
