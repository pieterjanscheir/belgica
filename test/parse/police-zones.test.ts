import { describe, expect, it } from 'vitest'

import { readDbf } from '../../scripts/parse/dbf.ts'
import { toPoliceZones } from '../../scripts/parse/police-zones.ts'
import { sources } from '../../scripts/sources/catalog.ts'
import type { Response } from '../../scripts/sources/http.ts'

/** A dBASE table with character fields, as a shapefile's .dbf */
function dbf(fields: [name: string, length: number][], rows: string[][], deleted: number[] = []) {
    const headerLength = 32 + fields.length * 32 + 1
    const recordLength = 1 + fields.reduce((sum, [, length]) => sum + length, 0)
    const file = Buffer.alloc(headerLength + rows.length * recordLength + 1, 0)
    file.writeUInt8(3, 0)
    file.writeUInt32LE(rows.length, 4)
    file.writeUInt16LE(headerLength, 8)
    file.writeUInt16LE(recordLength, 10)
    fields.forEach(([name, length], i) => {
        file.write(name, 32 + i * 32, 'latin1')
        file.write('C', 32 + i * 32 + 11, 'latin1')
        file.writeUInt8(length, 32 + i * 32 + 16)
    })
    file.writeUInt8(0x0d, headerLength - 1)
    rows.forEach((row, r) => {
        const start = headerLength + r * recordLength
        file.write(deleted.includes(r) ? '*' : ' ', start, 'latin1')
        let position = start + 1
        row.forEach((value, i) => {
            file.write(value.padEnd(fields[i]?.[1] ?? 0, ' '), position, 'utf8')
            position += fields[i]?.[1] ?? 0
        })
    })
    file.writeUInt8(0x1a, file.length - 1)
    return file
}

describe('readDbf', () => {
    it('reads every record as trimmed UTF-8 text, and skips deleted ones', () => {
        const file = dbf(
            [
                ['PoZoKey', 4],
                ['NameFRE', 30],
            ],
            [
                ['5403', 'RHODE-SAINT-GENÈSE'],
                ['9999', 'GONE'],
            ],
            [1],
        )
        expect(readDbf(file)).toEqual([{ PoZoKey: '5403', NameFRE: 'RHODE-SAINT-GENÈSE' }])
    })

    it('fails on a header without an end to the field descriptors', () => {
        const file = Buffer.alloc(64, 1)
        file.writeUInt16LE(40, 8)
        expect(() => readDbf(file)).toThrow(/no end/)
    })
})

const zone = (id: string, nl: string, alias = '') => ({
    PoZoKey: id,
    NameDUT: nl,
    NameFRE: nl,
    NameGER: nl,
    Alias: alias,
})
const source = { url: 'https://example.org/zones.zip', retrieved: '2026-11-02' }

describe('toPoliceZones', () => {
    it('builds each zone with its municipalities, in order', () => {
        const { zones, problems } = toPoliceZones(
            {
                zones: [zone('5415', 'GENT', 'GENT'), zone('5349', 'AARTSELAAR/EDEGEM')],
                municipalities: [
                    { ADMUKEY: '11013', POZOKEY: '5349' },
                    { ADMUKEY: '44021', POZOKEY: '5415' },
                    { ADMUKEY: '11001', POZOKEY: '5349' },
                ],
            },
            ['11001', '11013', '44021'],
            source,
        )
        expect(problems).toEqual([])
        expect(zones).toEqual([
            {
                id: '5349',
                name: { nl: 'AARTSELAAR/EDEGEM', fr: 'AARTSELAAR/EDEGEM', de: 'AARTSELAAR/EDEGEM' },
                municipalities: ['11001', '11013'],
                sources: [source],
            },
            {
                id: '5415',
                name: { nl: 'GENT', fr: 'GENT', de: 'GENT' },
                alias: 'GENT',
                municipalities: ['44021'],
                sources: [source],
            },
        ])
    })

    it('reports what a person has to look at', () => {
        const { problems } = toPoliceZones(
            {
                zones: [zone('5415', 'GENT'), zone('5000', 'EMPTY'), zone('', 'NO NUMBER')],
                municipalities: [
                    { ADMUKEY: '44021', POZOKEY: '5415' },
                    { ADMUKEY: '44021', POZOKEY: '5000' },
                    { ADMUKEY: '99999', POZOKEY: '5415' },
                    { ADMUKEY: '11001', POZOKEY: '6000' },
                ],
            },
            ['44021', '11001', '11002'],
            source,
        )
        expect(problems).toEqual([
            'police zones: municipality 44021 is in 5415 and 5000',
            "police zones: municipality 99999 isn't in municipalities.json",
            'police zones: municipality 11002 is in no zone',
            expect.stringMatching(/^police zones: a zone has no number/),
            "police zones: the municipality table has zone 6000, the zones don't",
        ])
    })
})

describe('police-zones source', () => {
    const FEED =
        'https://opendata.fin.belgium.be/download/ATOM/6bcbdf8f-e89f-11ec-be04-9453308970f2-en.xml'
    const zip = (day: string, projection = '3812') =>
        `https://opendata.fin.belgium.be/download/datasets/6bcbdf8f-e89f-11ec-be04-9453308970f2_${day}_shp_${projection}_01000.zip`
    const policeZones = sources.find((s) => s.name === 'police-zones')
    const site = (feed: string) => {
        const fetched: string[] = []
        const get = (url: string): Promise<Response> => {
            fetched.push(url)
            return Promise.resolve({
                url,
                status: 200,
                contentType: 'text/xml',
                body: Buffer.from(url === FEED ? feed : ''),
            })
        }
        return { get, fetched }
    }

    it('fetches the latest zip in Belgian Lambert 2008', async () => {
        const { get, fetched } = site(
            [zip('20240101'), zip('20260618', '31370'), zip('20260618')]
                .map((url) => `<link href="${url}"/>`)
                .join(''),
        )
        await policeZones?.fetch(get, () => 0)
        expect(fetched).toEqual([FEED, zip('20260618')])
    })

    it('fails when the feed lists no zip', async () => {
        const { get } = site('<feed/>')
        await expect(policeZones?.fetch(get, () => 0)).rejects.toThrow(/No police zones file/)
    })
})
