const t = require('tap')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

const packageJson = require('../../src/lib/helpers/packageJson')
const version = packageJson.version

const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
}

t.test('#--version', ct => {
  ct.equal(execShell(`${dotenvx} --version`), version)

  ct.end()
})
