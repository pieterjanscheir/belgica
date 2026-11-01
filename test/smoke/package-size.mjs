// Checks what `npm install belgica` downloads and unpacks, so a pull request that adds a dataset
// shows what it costs, and one that grows the package by accident fails:
//
// 1. The whole package, unpacked. Almost all of it is the boundary geometry, which stays the
//    NGI's vertex for vertex: a simplified border would put addresses in the wrong canton.
// 2. Everything but the geometry: the part every user installs, whatever they import.
// 3. Any single file outside the geometry: above about 500 KB a dataset is split into an index
//    and files loaded on demand (see "Adding a dataset" in docs/guide/contributing.md).
//
// Raise a limit on purpose, with the reason in the changelog.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const MB = 1024 * 1024
// 34.0 MB when the check was added (0.6.1), 30 MB of it the canton and arrondissement boundaries
const UNPACKED_LIMIT = 40 * MB
// 4.3 MB when the check was added (0.6.1)
const WITHOUT_GEOMETRY_LIMIT = 6 * MB
const FILE_LIMIT = 1 * MB
const geometry = (path) => /^data\/[a-z-]+-boundaries\.json$/.test(path)

const root = new URL('../../', import.meta.url).pathname
const [pack] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    }),
)
const rest = pack.files.filter((f) => !geometry(f.path))
const withoutGeometry = rest.reduce((sum, f) => sum + f.size, 0)
const largest = [...rest].sort((a, b) => b.size - a.size).slice(0, 5)

const mb = (bytes) => `${(bytes / MB).toFixed(1)} MB`
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`
const report = `Package size (\`npm pack\`):

| | Size | Limit |
| --- | ---: | ---: |
| Tarball | ${mb(pack.size)} | |
| Unpacked | ${mb(pack.unpackedSize)} | ${mb(UNPACKED_LIMIT)} |
| Unpacked, without the boundaries | ${mb(withoutGeometry)} | ${mb(WITHOUT_GEOMETRY_LIMIT)} |
| Largest file without the boundaries: \`${largest[0].path}\` | ${kb(largest[0].size)} | ${kb(FILE_LIMIT)} |

${pack.entryCount} files. The next largest: ${largest
    .slice(1)
    .map((f) => `\`${f.path}\` ${kb(f.size)}`)
    .join(', ')}.
`
console.log(report)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)

assert.ok(
    pack.unpackedSize <= UNPACKED_LIMIT,
    `The package is ${mb(pack.unpackedSize)} unpacked, over the limit of ${mb(UNPACKED_LIMIT)}`,
)
assert.ok(
    withoutGeometry <= WITHOUT_GEOMETRY_LIMIT,
    `Without the boundaries the package is ${mb(withoutGeometry)}, over the limit of ${mb(WITHOUT_GEOMETRY_LIMIT)}`,
)
for (const file of rest)
    assert.ok(
        file.size <= FILE_LIMIT,
        `${file.path} is ${kb(file.size)}, over the limit of ${kb(FILE_LIMIT)}: split it into an index and files loaded on demand`,
    )
