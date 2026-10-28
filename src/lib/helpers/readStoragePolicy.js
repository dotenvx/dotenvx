const { storagepolicy } = require('@dotenvx/primitives')
const fsx = require('./fsx')

function readStoragePolicy (envFilepath) {
  if (!fsx.existsSync('Dotenvxfile')) return undefined

  try {
    return storagepolicy(fsx.readFileXSync('Dotenvxfile'), envFilepath)
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

module.exports = readStoragePolicy
