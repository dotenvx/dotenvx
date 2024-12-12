const path = require('path')
const childProcess = require('child_process')

function proKeypair (envFilepath) {
  let result = {}

  try {
    // if installed as sibling module
    const projectRoot = path.resolve(process.cwd())
    const dotenvxProPath = require.resolve('@dotenvx/dotenvx-pro', { paths: [projectRoot] })
    const { keypair } = require(dotenvxProPath)

    result = keypair(envFilepath)
  } catch (_e) {
    try {
      // if installed as binary cli
      const output = childProcess.execSync(`dotenvx-pro keypair -f ${envFilepath}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()

      result = JSON.parse(output)
    } catch (_e) {
      // do nothing
    }
  }

  return result
}

module.exports = proKeypair
