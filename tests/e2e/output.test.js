const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')
const commandAction = path.resolve(__dirname, '../../src/cli/commandAction.js')
const value = 'abcdefghij'.repeat(100000)

function checkOutput (ct, actual, expected, label) {
  ct.equal(actual.length, expected.length, `${label} has every byte`)
  // Keep failure reports small even when a megabyte of output is truncated.
  ct.ok(actual === expected, `${label} matches exactly`)
}

t.test('command outcomes preserve piped stdout and stderr', ct => {
  for (const exitCode of [0, 7, 130]) {
    const result = spawnSync(process.execPath, ['-e', `
      // Commands must still terminate even if an unrelated handle remains open.
      setInterval(() => {}, 1000);
      require(${JSON.stringify(commandAction)})(async () => {
        process.stdout.write('o'.repeat(1000000));
        process.stderr.write('e'.repeat(1000000));
        return { exitCode: ${exitCode} };
      })();
    `], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 10000 })

    ct.error(result.error, `exit ${exitCode} completes without hanging`)
    ct.equal(result.status, exitCode, 'preserves the requested exit code')
    checkOutput(ct, result.stdout, 'o'.repeat(1000000), 'stdout')
    checkOutput(ct, result.stderr, 'e'.repeat(1000000), 'stderr')
  }
  ct.end()
})

t.test('get preserves large piped values and JSON on success and failure', ct => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-output-'))
  ct.teardown(() => fs.rmSync(cwd, { recursive: true, force: true }))
  fs.writeFileSync(path.join(cwd, '.env'), `BIG=${value}\n`)

  for (const json of [false, true]) {
    for (const missingFile of [false, true]) {
      const args = ['get', ...(json ? [] : ['BIG']), '-f', '.env']
      if (missingFile) args.push('-f', 'missing.env')
      const result = spawnSync(process.execPath, [cli, ...args], {
        cwd,
        env: { ...process.env, DOTENVX_NO_ARMOR: 'true', DOTENVX_CONFIG: cwd },
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        timeout: 10000
      })

      ct.error(result.error, 'get completes without hanging')
      ct.equal(result.status, missingFile ? 1 : 0, 'preserves success or failure status')
      const expected = (json ? JSON.stringify({ BIG: value }) : value) + '\n'
      checkOutput(ct, result.stdout, expected, json ? 'JSON output' : 'value output')
      if (missingFile) ct.match(result.stderr, /MISSING_ENV_FILE/, 'preserves the error diagnostic')
    }
  }
  ct.end()
})
