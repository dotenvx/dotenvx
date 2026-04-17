const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const { execSync, spawnSync } = require('child_process')

const originalDir = process.cwd()
const osTempDir = fs.realpathSync(os.tmpdir())

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
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
  t.match(output, /gitignore/, 'should say gitignore')
  t.match(output, /prebuild/, 'should say prebuild')
  t.match(output, /precommit/, 'should say precommit')

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

t.test('deprecated precommit forwards a string directory to ext action', ct => {
  const tempDir = fs.mkdtempSync(path.join(osTempDir, 'dotenvx-ext-precommit-'))
  fs.writeFileSync(path.join(tempDir, '.gitignore'), '')

  const result = runCommand(`${dotenvx} precommit`, tempDir)

  ct.equal(result.exitCode, 0, 'precommit exits successfully')
  ct.notMatch(result.output, /paths\[0\]/, 'does not fail with paths[0] type error')
  ct.match(result.output, /DEPRECATION NOTICE: \[precommit\]/, 'shows deprecation notice')

  ct.end()
})

t.test('deprecated prebuild forwards a string directory to ext action', ct => {
  const tempDir = fs.mkdtempSync(path.join(osTempDir, 'dotenvx-ext-prebuild-'))
  fs.writeFileSync(path.join(tempDir, '.dockerignore'), '')

  const result = runCommand(`${dotenvx} prebuild`, tempDir)

  ct.equal(result.exitCode, 0, 'prebuild exits successfully')
  ct.notMatch(result.output, /paths\[0\]/, 'does not fail with paths[0] type error')
  ct.match(result.output, /DEPRECATION NOTICE: \[prebuild\]/, 'shows deprecation notice')

  ct.end()
})
