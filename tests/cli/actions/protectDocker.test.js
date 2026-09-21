const t = require('tap')
const path = require('path')
const fs = require('fs')
const { spawnSync } = require('child_process')

const cli = path.resolve(__dirname, '../../../src/cli/dotenvx.js')
for (const [label, files, directory, status] of [
  ['encrypted', { '.env': 'SECRET=encrypted:example\n', '.dockerignore': '.env.keys\n' }, null, 0],
  ['plaintext', { '.env': 'SECRET=plaintext\n', '.dockerignore': '.env.keys\n' }, null, 1],
  ['ignored', { '.env': 'SECRET=plaintext\n', '.dockerignore': '.env\n' }, null, 0],
  ['missing ignore', { '.env': 'SECRET=encrypted:example\n' }, null, 0],
  ['private key', { '.env.keys': 'DOTENV_PRIVATE_KEY=plaintext\n', '.dockerignore': '' }, null, 1],
  ['directory', { app: { '.env': 'SECRET=plaintext\n' }, '.dockerignore': '' }, 'app', 1]
]) {
  t.test(`protect --docker matches prebuild: ${label}`, ct => {
    const cwd = ct.testdir(files)
    const config = path.join(cwd, 'global-gitconfig')
    const env = { ...process.env, CI: 'true', GIT_CONFIG_GLOBAL: config, NO_COLOR: '1' }
    const run = args => spawnSync(process.execPath, [cli, ...args, ...(directory ? [directory] : [])], { cwd, env, encoding: 'utf8' })
    const result = run(['protect', '--docker'])
    const legacy = run(['prebuild'])
    ct.equal(result.status, status, result.stderr)
    ct.equal(result.status, legacy.status)
    ct.equal(result.stdout, legacy.stdout)
    ct.equal(result.stderr, legacy.stderr.split('\n').filter(line => !line.includes('[DEPRECATED]')).join('\n'))
    ct.match(legacy.stderr, '[DEPRECATED] dotenvx prebuild. fix: run [dotenvx protect --docker]')
    ct.notMatch(result.stderr, /Set protections|\[DEPRECATED\]/)
    ct.notOk(fs.existsSync(config), 'no Git settings installed')
    ct.end()
  })
}

t.test('Docker mode cannot be combined with Git filter modes', ct => {
  for (const mode of [['--git-process'], ['--git-file', '.env']]) {
    const result = spawnSync(process.execPath, [cli, 'protect', '--docker', ...mode], { encoding: 'utf8' })
    ct.equal(result.status, 1)
    ct.match(result.stderr, 'cannot be used with')
  }
  ct.end()
})
