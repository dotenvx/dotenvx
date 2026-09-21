const t = require('tap')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { spawnSync } = require('child_process')
const { HOOK_SCRIPT } = require('../../../src/lib/helpers/installPrecommitHook')
const uninstall = require('../../../src/lib/helpers/uninstallPrecommitHook')
const cli = path.resolve(__dirname, '../../../src/cli/dotenvx.js')

function setup (ct) {
  const root = ct.testdir({})
  const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: path.join(root, 'config') }
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, env, encoding: 'utf8' })
  const git = (...args) => spawnSync('git', args, { cwd: root, env, encoding: 'utf8' })
  ct.equal(git('init', '-q').status, 0)
  const hook = path.join(root, '.git/hooks/pre-commit')
  return { root, hook, run, git }
}

t.test('uninstall removes an installed hook and is repeatable', ct => {
  const { hook, run } = setup(ct)
  ct.equal(run('precommit', '--install').status, 0)
  ct.ok(fs.existsSync(hook))
  ct.equal(run('precommit', '--uninstall').status, 0)
  ct.notOk(fs.existsSync(hook))
  ct.equal(run('precommit', '--uninstall').status, 0)
  ct.equal(run('precommit', '--install', '--uninstall').status, 1)
  ct.end()
})

t.test('protect installs first then removes only the dotenvx block', ct => {
  const { hook, run, git } = setup(ct)
  const original = '#!/bin/sh\necho custom-hook\n'
  fs.writeFileSync(hook, original, { mode: 0o755 })
  ct.equal(run('precommit', '--install').status, 0)
  const result = run('protect')
  ct.equal(result.status, 0, result.stderr)
  ct.equal(fs.readFileSync(hook, 'utf8'), original + '\n')
  if (process.platform !== 'win32') ct.equal(fs.statSync(hook).mode & 0o777, 0o755)
  ct.match(git('config', '--global', '--get', 'filter.dotenvx.clean').stdout, 'protect --git-file')
  ct.end()
})

t.test('customized hooks are preserved with a manual cleanup message', ct => {
  const { hook, run } = setup(ct)
  const custom = '#!/bin/sh\ndotenvx precommit --custom\necho other\n'
  fs.writeFileSync(hook, custom)
  const result = run('protect')
  ct.equal(result.status, 0)
  ct.match(result.stderr, 'remove its dotenvx precommit entry manually')
  ct.equal(fs.readFileSync(hook, 'utf8'), custom)
  ct.end()
})

t.test('legacy ext blocks and CRLF hooks can be removed', ct => {
  const { hook, run } = setup(ct)
  fs.writeFileSync(hook, HOOK_SCRIPT.replaceAll('dotenvx precommit', 'dotenvx ext precommit').replaceAll('\n', '\r\n'))
  ct.equal(run('ext', 'precommit', '--uninstall').status, 0)
  ct.notOk(fs.existsSync(hook))
  ct.end()
})

t.test('commit-time precommit displays migration notice even when validation fails', ct => {
  const { root, run } = setup(ct)
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=plaintext\n')
  const result = run('precommit')
  ct.equal(result.status, 1)
  ct.match(result.stderr, '[DEPRECATED] dotenvx precommit. fix: run [dotenvx protect]')
  ct.end()
})

t.test('no repository is a no-op', ct => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-no-repo-'))
  ct.teardown(() => fs.rmSync(directory, { recursive: true, force: true }))
  ct.same(uninstall(directory), { removed: false })
  ct.end()
})

t.test('custom hooksPath inside the repository is respected', ct => {
  const { root, run, git } = setup(ct)
  fs.mkdirSync(path.join(root, 'hooks'))
  const hook = path.join(root, 'hooks/pre-commit')
  fs.writeFileSync(hook, HOOK_SCRIPT)
  ct.equal(git('config', 'core.hooksPath', 'hooks').status, 0)
  ct.equal(run('precommit', '--uninstall').status, 0)
  ct.notOk(fs.existsSync(hook))
  ct.end()
})

t.test('symlinked hooks are left alone', { skip: process.platform === 'win32' }, ct => {
  const { root, hook, run } = setup(ct)
  const target = path.join(root, 'custom-hook')
  fs.writeFileSync(target, HOOK_SCRIPT)
  fs.symlinkSync(target, hook)
  ct.match(run('protect').stderr, 'left unchanged')
  ct.equal(fs.readFileSync(target, 'utf8'), HOOK_SCRIPT)
  ct.ok(fs.lstatSync(hook).isSymbolicLink())
  ct.end()
})

t.test('failed protection installation leaves the old hook intact', ct => {
  const { root, hook, run } = setup(ct)
  fs.writeFileSync(hook, HOOK_SCRIPT)
  fs.mkdirSync(path.join(root, 'gitconfig'))
  ct.equal(run('protect').status, 1)
  ct.equal(fs.readFileSync(hook, 'utf8'), HOOK_SCRIPT)
  ct.end()
})

t.test('shared external hooks are preserved', ct => {
  const { hook, run, git } = setup(ct)
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-shared-hooks-'))
  ct.teardown(() => fs.rmSync(external, { recursive: true, force: true }))
  const sharedHook = path.join(external, 'pre-commit')
  fs.writeFileSync(sharedHook, HOOK_SCRIPT)
  fs.writeFileSync(hook, HOOK_SCRIPT)
  ct.equal(git('config', 'core.hooksPath', external).status, 0)
  ct.match(run('protect').stderr, 'left unchanged')
  ct.equal(fs.readFileSync(sharedHook, 'utf8'), HOOK_SCRIPT)
  ct.equal(fs.readFileSync(hook, 'utf8'), HOOK_SCRIPT)
  ct.end()
})
