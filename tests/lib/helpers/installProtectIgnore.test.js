const t = require('tap')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const helper = path.resolve(__dirname, '../../../src/lib/helpers/installProtectIgnore.js')
const cli = path.resolve(__dirname, '../../../src/cli/dotenvx.js')

for (const custom of [false, true]) {
  t.test(`global private-key ignore (${custom ? 'custom' : 'default'} file)`, ct => {
    const root = ct.testdir({})
    const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: path.join(root, 'config') }
    const run = (cmd, args, cwd = root) => spawnSync(cmd, args, { cwd, env, encoding: 'utf8' })
    const ignorePath = custom ? path.join(root, 'custom ignore') : path.join(root, 'config/git/ignore')
    fs.mkdirSync(path.dirname(ignorePath), { recursive: true })
    fs.writeFileSync(ignorePath, '*.log\n.env.local')
    if (custom) ct.equal(run('git', ['config', '--global', 'core.excludesFile', ignorePath]).status, 0)
    for (let i = 0; i < 2; i++) ct.equal(run(process.execPath, ['-e', `require(${JSON.stringify(helper)})()`]).status, 0)
    ct.equal(fs.readFileSync(ignorePath, 'utf8'), '*.log\n.env.local\n.env.keys*\n')
    const repo = path.join(root, 'repo')
    fs.mkdirSync(repo)
    ct.equal(run('git', ['init', '-q'], repo).status, 0)
    fs.mkdirSync(path.join(repo, 'app'))
    for (const filename of ['.env.keys', 'app/.env.keys.production']) {
      fs.writeFileSync(path.join(repo, filename), 'DOTENV_PRIVATE_KEY=dummy\n')
      ct.equal(run('git', ['check-ignore', filename], repo).status, 0)
    }
    ct.equal(run('git', ['check-ignore', '.env'], repo).status, 1)
    ct.equal(run('git', ['check-ignore', '.env.local'], repo).status, 0)
    ct.equal(run(process.execPath, [cli, 'protect'], repo).status, 0)
    ct.equal(run('git', ['add', '.'], repo).status, 0)
    ct.equal(run('git', ['ls-files'], repo).stdout, '')
    ct.not(run('git', ['add', '-f', '.env.keys'], repo).status, 0)
    ct.end()
  })
}
