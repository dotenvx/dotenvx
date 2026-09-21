const t = require('tap')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

t.test('settings round trip preserves unrelated rules and remembers removal', ct => {
  const root = ct.testdir({})
  const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: path.join(root, 'config') }
  const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, env, encoding: 'utf8' })
  const helper = name => JSON.stringify(path.resolve(__dirname, '../../../src/lib/helpers', name))
  const settings = helper('protectSettings.js')
  const execute = code => run(process.execPath, ['-e', code])
  const state = () => JSON.parse(execute(`console.log(JSON.stringify(require(${settings}).state()))`).stdout)
  const attributes = path.join(root, 'attributes')
  const ignore = path.join(root, 'ignore')
  fs.writeFileSync(attributes, '*.txt text\n')
  fs.writeFileSync(ignore, '*.log\n')
  ct.equal(run('git', ['config', '--global', 'core.attributesFile', attributes]).status, 0)
  ct.equal(run('git', ['config', '--global', 'core.excludesFile', ignore]).status, 0)
  ct.same(state(), { configured: false, filter: false, ignore: false })
  const install = `require(${helper('installProtectFilter.js')})();require(${helper('installProtectIgnore.js')})();require(${settings}).markConfigured()`
  ct.equal(execute(install).status, 0)
  ct.same(state(), { configured: true, filter: true, ignore: true })
  ct.equal(execute(`require(${settings}).removeIgnore()`).status, 0)
  ct.same(state(), { configured: true, filter: true, ignore: false })
  ct.equal(fs.readFileSync(ignore, 'utf8'), '*.log\n')
  ct.equal(execute(`require(${settings}).removeFilter()`).status, 0)
  ct.same(state(), { configured: true, filter: false, ignore: false })
  ct.equal(fs.readFileSync(attributes, 'utf8'), '*.txt text\n')
  ct.equal(run('git', ['init', '-q']).status, 0)
  fs.writeFileSync(path.join(root, '.env'), 'TEST=example\n')
  ct.equal(run('git', ['add', '-f', '.env']).status, 0, 'disabled filter does not break staging')
  ct.equal(execute(install).status, 0)
  ct.same(state(), { configured: true, filter: true, ignore: true })
  ct.end()
})

t.test('unowned ignore rules are not removed', ct => {
  const root = ct.testdir({})
  const ignore = path.join(root, 'config/git/ignore')
  fs.mkdirSync(path.dirname(ignore), { recursive: true })
  fs.writeFileSync(ignore, '.env.keys*\n*.log\n')
  const helper = JSON.stringify(path.resolve(__dirname, '../../../src/lib/helpers/protectSettings.js'))
  const result = spawnSync(process.execPath, ['-e', `require(${helper}).removeIgnore()`], {
    cwd: root,
    env: { ...process.env, GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: path.join(root, 'config') },
    encoding: 'utf8'
  })
  ct.not(result.status, 0)
  ct.match(result.stderr, 'no dotenvx ownership record')
  ct.equal(fs.readFileSync(ignore, 'utf8'), '.env.keys*\n*.log\n')
  ct.end()
})
