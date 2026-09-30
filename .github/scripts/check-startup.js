const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { performance } = require('node:perf_hooks')

// Usage: node .github/scripts/check-startup.js path/to/packaged/dotenvx
// Measure the whole command, including spawning Node and loading a plain .env.
// Warm up OS caches first; every measured run must stay below the budget.
const LIMIT_MS = 500
const WARMUP_RUNS = 2
const MEASURED_RUNS = 7
assert.ok(process.argv[2], 'Provide the packaged dotenvx executable to benchmark')
const binary = path.resolve(process.argv[2])
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-startup-'))

try {
  fs.writeFileSync(path.join(directory, '.env'), 'HELLO=StartupCheck\n')
  fs.writeFileSync(path.join(directory, 'index.js'), "console.log('Hello ' + process.env.HELLO)\n")

  // Isolate application variables, credentials, Node options, and user config.
  const env = { DOTENVX_CONFIG: path.join(directory, 'config'), DOTENVX_NO_ARMOR: 'true' }
  for (const key of ['PATH', 'SystemRoot', 'TEMP', 'TMP', 'TMPDIR']) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }

  const timings = []
  for (let i = 0; i < WARMUP_RUNS + MEASURED_RUNS; i++) {
    const start = performance.now()
    const result = spawnSync(binary, ['run', '--', process.execPath, 'index.js'], {
      cwd: directory,
      env,
      encoding: 'utf8',
      timeout: 10000
    })
    const elapsed = performance.now() - start
    if (result.error) throw result.error
    assert.equal(result.status, 0, `dotenvx run failed: ${result.stderr}`)
    assert.match(result.stdout, /(?:^|\n)Hello StartupCheck\r?\n?$/)
    if (i >= WARMUP_RUNS) timings.push(elapsed)
  }

  console.log(`Packaged startup after ${WARMUP_RUNS} warmups (ms): ${timings.map(ms => ms.toFixed(1)).join(', ')}`)
  const slowest = Math.max(...timings)
  assert.ok(slowest < LIMIT_MS, `Startup regression: slowest run ${slowest.toFixed(1)} ms; every measured run must be under ${LIMIT_MS} ms`)
} finally {
  fs.rmSync(directory, { recursive: true, force: true })
}
