const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const fixtures = path.join(root, 'benchmarks/fixtures')
const expected = require('../benchmarks/fixtures/expected.json')
const betaVersion = '3.0.0-rc0'
const runs = process.argv.includes('--smoke') ? 3 : 50
const warmup = process.argv.includes('--smoke') ? 1 : 5
const results = path.join(root, 'benchmark-results')
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-performance-'))
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
  !name.startsWith('DOTENV') && name !== 'NODE_OPTIONS' && !Object.hasOwn(expected, name)
))
Object.assign(env, {
  CI: 'true',
  DOTENVX_NO_TELEMETRY: 'true',
  DOTENVX_NO_ARMOR: 'true',
  DOTENVX_NO_NATIVE: 'true',
  DOTENVX_NO_1PASSWORD: 'true',
  DOTENVX_NO_BITWARDEN: 'true',
  DOTENVX_CONFIG: path.join(work, 'config')
})

function execute (binary, args, capture = false) {
  return execFileSync(binary, args, {
    cwd: work,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit'
  })
}

function install (name, version) {
  const directory = path.join(work, name)
  const installer = path.join(work, `${name}-install.sh`)
  const url = version ? `https://dotenvx.sh?version=${version}` : 'https://dotenvx.sh'
  execute('curl', ['--fail', '--silent', '--show-error', '--location', '--retry', '3', '--max-time', '120', url, '--output', installer])
  execute('sh', [installer, `--directory=${directory}`, ...(version ? [`--version=${version}`] : [])])
  const binary = path.join(directory, 'dotenvx')
  const actual = execute(binary, ['--version'], true).trim()
  if (version) assert.equal(actual, version, 'Pinned RC version must match')
  else assert.match(actual, /^2\./, 'The stable installer must still serve dotenvx 2.x')
  return { binary, version: actual, binarySizeBytes: fs.statSync(binary).size }
}

function median (result) {
  // Ubuntu's packaged Hyperfine uses schema 1; newer Hyperfine uses schema 2.
  return result.median ?? result.summary?.time_wall_clock?.median
}

try {
  fs.mkdirSync(results, { recursive: true })
  fs.copyFileSync(path.join(fixtures, 'legacy.env'), path.join(work, '.env'))
  fs.copyFileSync(path.join(fixtures, 'keys.env'), path.join(work, '.env.keys'))
  fs.chmodSync(path.join(work, '.env.keys'), 0o600)
  const hyperfine = execute('hyperfine', ['--version'], true).trim()
  const stable = install('dotenvx-2')
  const beta = install('dotenvx-3', betaVersion)

  for (const release of [stable, beta]) {
    execute(release.binary, ['run', '--strict', '--quiet', '-f', '.env', '--', process.execPath, path.join(root, 'benchmarks/verify-env.cjs')])
  }

  const metadata = {
    date: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    os: os.release(),
    cpu: os.cpus()[0]?.model,
    runnerImage: process.env.ImageOS,
    runnerImageVersion: process.env.ImageVersion,
    hyperfine,
    stableVersion: stable.version,
    betaVersion: beta.version,
    stableBinarySizeBytes: stable.binarySizeBytes,
    betaBinarySizeBytes: beta.binarySizeBytes,
    variables: Object.keys(expected).length,
    format: 'legacy encrypted:',
    child: '/usr/bin/true',
    runs,
    warmup,
    smoke: process.argv.includes('--smoke')
  }
  fs.writeFileSync(path.join(results, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')

  // Hyperfine splits these arguments with shell-like quoting but executes them
  // directly (--shell=none); no shell or Node application runs in the timing.
  const command = release => [release.binary, 'run', '--strict', '--quiet', '-f', '.env', '--', '/usr/bin/true']
    .map(argument => JSON.stringify(argument)).join(' ')
  execute('hyperfine', [
    '--shell=none', '--warmup', String(warmup), '--runs', String(runs),
    '--export-json', path.join(results, 'startup.json'),
    '--export-markdown', path.join(results, 'startup.md'),
    '--command-name', `dotenvx 2 (${stable.version})`, command(stable),
    '--command-name', `dotenvx 3 RC (${beta.version})`, command(beta)
  ])

  const measured = JSON.parse(fs.readFileSync(path.join(results, 'startup.json'), 'utf8')).results
  const times = measured.map(median)
  assert.equal(times.length, 2)
  assert.ok(times.every(value => Number.isFinite(value) && value > 0), 'Expected two valid median timings')
  const summary = [
    '## dotenvx run startup benchmark',
    '',
    `${process.platform} ${process.arch} | ${hyperfine} | ${runs} runs after ${warmup} warmups`,
    '',
    `Median of ${runs} runs after ${warmup} warmups.`,
    '',
    '30 fake variables, legacy encryption, local .env.keys, telemetry and remote custody disabled.',
    'Each timed command loads/decrypts .env and launches /usr/bin/true. No Node app is launched.',
    'Both binaries pass an untimed check of all 30 decrypted values before benchmarking.',
    '',
    '| Published binary | Startup time | Binary size |',
    '| --- | ---: | ---: |',
    `| dotenvx 2 (${stable.version}) | ${(times[0] * 1000).toFixed(2)} ms | ${(stable.binarySizeBytes / 1e6).toFixed(2)} MB |`,
    `| dotenvx 3 RC (${beta.version}) | ${(times[1] * 1000).toFixed(2)} ms | ${(beta.binarySizeBytes / 1e6).toFixed(2)} MB |`,
    '',
    `Stable / RC median time ratio: **${(times[0] / times[1]).toFixed(2)}×**.`,
    '',
    'Binary size is the uncompressed executable size; 1 MB = 1,000,000 bytes.',
    '',
    'Timings are informational; correctness, installer, and command failures fail the job.',
    ...(metadata.smoke ? ['', '**Smoke run only: do not use these timings as published performance results.**'] : []),
    ''
  ].join('\n')
  fs.writeFileSync(path.join(results, 'summary.md'), summary)
  console.log(summary)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
} finally {
  fs.rmSync(work, { recursive: true, force: true })
}
