const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { which } = require('@dotenvx/tooling')
const { spawnSync } = require('child_process')

const originalDir = process.cwd()
const osTempDir = fs.realpathSync(os.tmpdir())

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  const result = spawnSync(commands, {
    encoding: 'utf8',
    shell: true
  })

  return `${result.stdout || ''}${result.stderr || ''}`.trim()
}

function runCommand (command, cwd) {
  const result = spawnSync(command, {
    encoding: 'utf8',
    shell: true,
    cwd
  })

  return {
    exitCode: result.status,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim()
  }
}

t.test('ext', ct => {
  const output = execShell(`${dotenvx} ext`)

  t.match(output, /genexample/, 'should say genexample')
  t.notMatch(output, /gitignore/, 'does not list gitignore')
  t.notMatch(output, /prebuild/, 'does not list prebuild')
  t.notMatch(output, /precommit/, 'does not list precommit')

  ct.end()
})

t.test('ext missing', ct => {
  const output = execShell(`${dotenvx} ext missing`)

  t.match(output, "error: unknown command 'missing'", 'should say installation needed')

  ct.end()
})

t.test('ext vault', ct => {
  const output = execShell(`${dotenvx} ext vault`)

  t.match(output, /\[INSTALLATION_NEEDED\] install dotenvx-ext-vault to use \[dotenvx ext vault\] commands/, 'should say installation needed')
  t.match(output, /see installation instructions/, 'should say see installation instructions')

  ct.end()
})

t.test('genexample works as a direct command', ct => {
  const tempDir = fs.mkdtempSync(path.join(osTempDir, 'dotenvx-genexample-'))
  fs.writeFileSync(path.join(tempDir, '.env'), 'HELLO=Dotenvx\n')

  const result = runCommand(`${dotenvx} genexample`, tempDir)

  ct.equal(result.exitCode, 0, 'genexample exits successfully')
  ct.match(result.output, /generated \(\.env\.example\)/, 'generates .env.example')
  ct.equal(fs.readFileSync(path.join(tempDir, '.env.example'), 'utf8'), '# .env.example - generated with dotenvx\n\nHELLO=\n')

  ct.end()
})
