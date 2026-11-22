// Checks what `belgica/courts` loads: the files the built entry point imports, followed through
// the shared chunks. The court labels need each canton's name and number, not the cantons data
// with its territory texts, so that data must stay out; and the whole stays under a size limit,
// so a change that pulls in more data fails here instead of in someone's bundle.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const dist = new URL('../../dist/', import.meta.url)
// 52.1 KB in 0.4.0; 55.0 KB in 0.5.0, which stores each justice of the peace's canton label;
// 57.8 KB with the areas of the police courts' 33 divisions and the decrees they cite.
// Raise it on purpose, with the reason in the changelog
const LIMIT = 58_500

const files = new Set()
const visit = (file) => {
    if (files.has(file)) return
    files.add(file)
    const code = readFileSync(new URL(file, dist), 'utf8')
    for (const [, imported] of code.matchAll(/from\s*"\.\/([^"]+)"/g)) visit(imported)
}
visit('courts.js')
const code = [...files].map((file) => readFileSync(new URL(file, dist), 'utf8')).join('\n')

const cantons = JSON.parse(readFileSync(new URL('../../data/cantons.json', import.meta.url)))
const territory = cantons[0].territory.nl.slice(0, 60)
assert.ok(!code.includes(territory), 'belgica/courts includes the cantons data')

const size = gzipSync(code, { level: 9 }).length
assert.ok(size <= LIMIT, `belgica/courts is ${size} bytes gzipped, over the limit of ${LIMIT}`)

console.log(`belgica/courts: ${files.size} files, ${size} bytes gzipped (limit ${LIMIT})`)
