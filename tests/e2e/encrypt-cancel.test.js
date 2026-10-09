const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '../..')
const cli = path.join(root, 'src/cli/dotenvx.js')

for (const initial of [null, 'HELLO="World"\n']) {
  for (const rejection of ["''", 'undefined', 'null', "new Error('Sign in with [dotenvx login], then retry this command.')"]) {
    t.test(`encrypt preserves ${initial === null ? 'missing' : 'existing'} file when storage rejects with ${rejection}`, t => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-cancel-'))
      t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
      const envFile = path.join(dir, '.env')
      if (initial !== null) fs.writeFileSync(envFile, initial)
      const preload = path.join(dir, 'preload.cjs')
      fs.writeFileSync(preload, `
        const root = ${JSON.stringify(root)}
        const CustodySelect = require(root + '/src/lib/helpers/custodySelect')
        CustodySelect.prototype.run = () => Promise.reject(${rejection})
        const prompts = require(root + '/src/lib/helpers/prompts')
        const select = require.resolve(root + '/src/lib/helpers/selectKeyStorage')
        require.cache[select] = { id: select, filename: select, loaded: true, exports: () => prompts.select({ message: 'Choose private key custody', choices: [], navigation: true }) }
      `)
      const result = spawnSync(process.execPath, ['--require', preload, cli, 'encrypt'], {
        cwd: dir,
        env: { ...process.env, CI: 'true', DOTENVX_NO_ARMOR: 'true', DOTENVX_NO_NATIVE: 'true', DOTENVX_CONFIG: path.join(dir, 'config') },
        encoding: 'utf8'
      })
      t.equal(result.status, 1, 'cancellation or login requirement exits unsuccessfully')
      t.notMatch(result.stderr, '◈ encrypted', 'never reports encryption success')
      if (initial === null) t.notOk(fs.existsSync(envFile), 'does not leave an orphan public key')
      else t.equal(fs.readFileSync(envFile, 'utf8'), initial, 'original plaintext remains intact')
      t.notOk(fs.existsSync(path.join(dir, '.env.keys')), 'does not create a key file')
      t.end()
    })
  }
}
