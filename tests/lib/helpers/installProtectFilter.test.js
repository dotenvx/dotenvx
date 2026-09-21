const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const cli = path.resolve(__dirname, '../../../src/cli/dotenvx.js')
const attributesRules = '.env* filter=dotenvx\n*.env filter=dotenvx\n.flaskenv filter=dotenvx\n.dev.vars* filter=dotenvx\n**/.env.d/* filter=dotenvx\n'

for (const custom of [false, true]) {
  t.test(`global install protects existing and future repos (${custom ? 'custom' : 'default'} attributes)`, ct => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-global-filter-'))
    ct.teardown(() => fs.rmSync(root, { recursive: true, force: true }))
    const config = path.join(root, 'gitconfig')
    const xdg = path.join(root, 'config')
    const attributes = custom ? path.join(root, 'custom attributes') : path.join(xdg, 'git/attributes')
    const run = (cwd, command, args) => spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: xdg }
    })
    const git = (cwd, ...args) => run(cwd, 'git', args)
    const existing = path.join(root, 'existing')
    fs.mkdirSync(existing)
    ct.equal(git(existing, 'init', '-q').status, 0)
    fs.mkdirSync(path.dirname(attributes), { recursive: true })
    fs.writeFileSync(attributes, '*.txt text\n.env* filter=dotenvx\n')
    if (custom) ct.equal(git(root, 'config', '--global', 'core.attributesFile', attributes).status, 0)
    for (let i = 0; i < 2; i++) {
      const result = run(root, process.execPath, [cli, 'protect'])
      ct.equal(result.status, 0, result.stderr)
    }
    ct.equal(fs.readFileSync(attributes, 'utf8'), '*.txt text\n' + attributesRules)
    ct.equal(git(root, 'config', '--global', '--get', 'filter.dotenvx.required').stdout.trim(), 'true')
    ct.match(git(root, 'config', '--global', '--get', 'filter.dotenvx.clean').stdout, 'protect --git-file %f')
    ct.equal(git(root, 'config', '--global', '--get', 'core.hooksPath').status, 1)
    if (custom) ct.equal(git(root, 'config', '--global', '--get', 'core.attributesFile').stdout.trim(), attributes)
    const future = path.join(root, 'future')
    fs.mkdirSync(future)
    ct.equal(git(future, 'init', '-q').status, 0)
    for (const cwd of [existing, future]) {
      fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=plain\n')
      ct.not(git(cwd, 'add', '-A').status, 0)
      ct.not(git(cwd, 'add', '-f', '.env').status, 0)
      ct.equal(git(cwd, 'ls-files').stdout, '')
      ct.equal(git(cwd, 'config', '--local', '--get', 'filter.dotenvx.clean').status, 1)
      ct.notOk(fs.existsSync(path.join(cwd, '.git/hooks/pre-commit')))
      fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=encrypted:example\n')
      ct.equal(git(cwd, 'add', '.env').status, 0)
      ct.equal(git(cwd, 'show', ':.env').stdout, 'SECRET=encrypted:example\n')
    }
    ct.equal(run(root, process.execPath, [cli, 'precommit', '--global']).status, 1)
    ct.end()
  })
}

function repo (ct) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-filter-'))
  ct.teardown(() => fs.rmSync(cwd, { recursive: true, force: true }))
  const run = (command, args, options = {}) => spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_GLOBAL: path.join(cwd, '.git/test-gitconfig'), GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: path.join(cwd, '.git/test-config') },
    ...options
  })
  const git = (...args) => run('git', args)
  ct.equal(git('init', '-q').status, 0)
  const install = () => run(process.execPath, [cli, 'protect'])
  return { cwd, run, git, install }
}

t.test('precommit install only installs a hook and preserves existing attributes', ct => {
  const { cwd, git, run } = repo(ct)
  fs.writeFileSync(path.join(cwd, '.git/info/attributes'), '*.txt text')
  fs.writeFileSync(path.join(cwd, '.git/hooks/pre-commit'), '#!/bin/sh\necho existing\n')
  for (let i = 0; i < 2; i++) {
    const result = run(process.execPath, [cli, 'precommit', '--install'])
    ct.equal(result.status, 0, result.stderr)
  }
  ct.equal(git('config', '--get', 'filter.dotenvx.required').status, 1)
  ct.equal(fs.readFileSync(path.join(cwd, '.git/info/attributes'), 'utf8'), '*.txt text')
  const hook = fs.readFileSync(path.join(cwd, '.git/hooks/pre-commit'), 'utf8')
  ct.match(hook, 'echo existing')
  ct.equal(hook.split('if command -v dotenvx').length, 2)
  ct.end()
})

t.test('protect is hidden and precommit no longer accepts filter options', ct => {
  const { run } = repo(ct)
  const invoke = args => run(process.execPath, [cli, ...args])
  ct.notMatch(invoke(['--help']).stdout, /\n\s+protect\s/)
  ct.match(invoke(['hidden']).stdout, /\n\s+protect\s/)
  ct.notMatch(invoke(['protect', '--help']).stdout, /--git-file|--clean|--global|--install/)
  for (const command of [['precommit'], ['ext', 'precommit']]) {
    ct.equal(invoke([...command, '--global']).status, 1)
    ct.equal(invoke([...command, '--clean', '.env']).status, 1)
  }
  ct.end()
})

t.test('rejects plaintext with add -A and forced add; allows encrypted bytes unchanged', ct => {
  const { cwd, git, install } = repo(ct)
  ct.equal(install().status, 0)
  fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=plaintext\n')
  ct.not(git('add', '-A').status, 0)
  ct.equal(git('ls-files').stdout, '')
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.env\n')
  ct.not(git('add', '-f', '.env').status, 0)
  ct.equal(git('ls-files', '.env').stdout, '')
  const encrypted = '# keep CRLF\r\nSECRET="encrypted:example"\r\n'
  fs.writeFileSync(path.join(cwd, '.env'), encrypted)
  ct.equal(git('add', '-f', '.env').status, 0)
  ct.equal(git('show', ':.env').stdout, encrypted)
  fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=changed\n')
  ct.not(git('add', '-A').status, 0, 'also protects tracked files')
  ct.equal(git('show', ':.env').stdout, encrypted)
  ct.end()
})

t.test('nested paths, exemptions, private keys, and missing executable', ct => {
  const { cwd, git, install } = repo(ct)
  ct.equal(install().status, 0)
  const directory = "café app's"
  fs.mkdirSync(path.join(cwd, directory))
  for (const filename of ['.env.production', '.env.keys', '.env.keys.production']) {
    const file = `${directory}/${filename}`
    fs.writeFileSync(path.join(cwd, file), filename.includes('keys') ? '# even empty keys files\n' : 'SECRET=plain\n')
    ct.not(git('add', file).status, 0, file)
    ct.equal(git('ls-files', file).stdout, '')
  }
  for (const filename of ['.env.example', '.env.vault', '.env.x']) {
    const file = `${directory}/${filename}`
    const content = 'EXAMPLE=allowed\n'
    fs.writeFileSync(path.join(cwd, file), content)
    ct.equal(git('add', file).status, 0, file)
    ct.equal(git('show', `:${file}`).stdout, content)
  }
  fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=encrypted:example\n')
  git('config', 'filter.dotenvx.clean', 'dotenvx-missing-executable-test')
  ct.not(git('add', '.env').status, 0)
  ct.equal(git('ls-files', '.env').stdout, '')
  ct.end()
})

t.test('additional env formats are protected at root and nested paths', ct => {
  const { cwd, git, install } = repo(ct)
  ct.equal(install().status, 0)
  for (const prefix of ['', 'app/']) {
    for (const name of ['.dev.vars', '.dev.vars.production', '.flaskenv', 'config.env', '.env.d/production']) {
      const filename = prefix + name
      const filepath = path.join(cwd, filename)
      fs.mkdirSync(path.dirname(filepath), { recursive: true })
      fs.writeFileSync(filepath, 'SECRET=plaintext\n')
      ct.not(git('add', '-f', '--', filename).status, 0, `${filename} rejects plaintext`)
      ct.equal(git('ls-files', '--', filename).stdout, '')
      const encrypted = 'SECRET=encrypted:example\n'
      fs.writeFileSync(filepath, encrypted)
      ct.equal(git('add', '--', filename).status, 0, `${filename} accepts encrypted content`)
      ct.equal(git('show', `:${filename}`).stdout, encrypted)
    }
  }
  for (const filename of ['Dockerfile', 'docker-compose.yml', 'settings.json']) {
    fs.writeFileSync(path.join(cwd, filename), 'SECRET=plaintext\n')
    ct.equal(git('add', filename).status, 0, `${filename} is not filtered`)
  }
  ct.end()
})

t.test('precommit scan discovers additional env formats', ct => {
  const { cwd } = repo(ct)
  const Precommit = require('../../../src/lib/services/precommit')
  const files = ['.dev.vars', 'app/.dev.vars.staging', '.flaskenv', 'app/config.env', '.env.d/production', 'app/.env.d/local']
  for (const filename of [...files, 'Dockerfile', 'docker-compose.yml']) {
    const filepath = path.join(cwd, filename)
    fs.mkdirSync(path.dirname(filepath), { recursive: true })
    fs.writeFileSync(filepath, 'SECRET=plaintext\n')
  }
  ct.same(new Precommit(cwd)._filepaths().sort(), files.sort())
  ct.end()
})

t.test('clean mode reads stdin, preserves stdout, and never leaks rejected contents', ct => {
  const { run } = repo(ct)
  const result = run(process.execPath, [cli, '--debug', 'protect', '--git-file', '.env'], { input: 'SECRET=do-not-print\n' })
  ct.equal(result.status, 1)
  ct.equal(result.stdout, '')
  ct.notMatch(result.stderr, 'do-not-print')
  const allowed = '# comment\nSECRET=encrypted:example\n'
  const success = run(process.execPath, [cli, '--debug', 'protect', '--git-file', '.env'], { input: allowed })
  ct.equal(success.status, 0)
  ct.equal(success.stdout, allowed)
  ct.end()
})

t.test('Git quotes shell metacharacters in %f without executing filename contents', ct => {
  const { cwd, git, install } = repo(ct)
  ct.equal(install().status, 0)
  const filenames = [
    '.env; touch injected; #',
    '.env$(touch injected)',
    '.env`touch injected`',
    ".env'; touch injected; #",
    '.env"; touch injected; #',
    '.env\ntouch injected\n#',
    '.env | touch injected #',
    '.env space ! %f \\ name'
  ]
  for (const filename of filenames) {
    const filepath = path.join(cwd, filename)
    fs.writeFileSync(filepath, 'SECRET=plaintext\n')
    const rejected = git('add', '-f', '--', filename)
    ct.not(rejected.status, 0, 'plaintext is rejected')
    ct.match(rejected.stderr, `refusing to stage ${JSON.stringify(filename)}:`, 'filter receives the literal filename')
    ct.equal(git('ls-files', '-z').stdout, '', 'rejected file is not staged')
    ct.notOk(fs.existsSync(path.join(cwd, 'injected')), 'filename commands did not execute')

    const encrypted = 'SECRET=encrypted:example\n'
    fs.writeFileSync(filepath, encrypted)
    const accepted = git('add', '-A')
    ct.equal(accepted.status, 0, accepted.stderr)
    ct.equal(git('ls-files', '-z').stdout, filename + '\0', 'literal filename is staged')
    ct.equal(git('show', `:${filename}`).stdout, encrypted, 'encrypted content is unchanged')
    ct.notOk(fs.existsSync(path.join(cwd, 'injected')), 'filename commands did not execute')
    ct.equal(git('rm', '-f', '--', filename).status, 0)
  }
  ct.end()
})
