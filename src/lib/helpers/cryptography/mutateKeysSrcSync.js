const FIRST_TIME_KEYS_SRC = [
  '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
  '#/ private decryption keys. DO NOT commit to source control /',
  '#/     [how it works](https://dotenvx.com/encryption)       /',
  // '#/           backup with: `dotenvx ops backup`              /',
  '#/----------------------------------------------------------/'
].join('\n')

const path = require('path')
const fsx = require('./../fsx')

function mutateKeysSrcSync ({ envFilepath, keysFilepath, privateKeyName, privateKeyValue }) {
  const filename = path.basename(envFilepath)
  const filepath = path.resolve(envFilepath)
  let resolvedKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
  if (keysFilepath) {
    resolvedKeysFilepath = path.resolve(keysFilepath)
  }
  const appendPrivateKey = [`# ${filename}`, `${privateKeyName}=${privateKeyValue}`, ''].join('\n')

  let keysSrc = ''
  if (fsx.existsSync(resolvedKeysFilepath)) {
    keysSrc = fsx.readFileXSync(resolvedKeysFilepath)
  }
  keysSrc = keysSrc.length > 1 ? keysSrc : `${FIRST_TIME_KEYS_SRC}\n`
  keysSrc = `${keysSrc}\n${appendPrivateKey}`

  fsx.writeFileXSync(resolvedKeysFilepath, keysSrc) // TODO: don't write if ops

  const envKeysFilepath = keysFilepath || path.join(path.dirname(envFilepath), path.basename(resolvedKeysFilepath))

  return {
    keysSrc,
    envKeysFilepath
  }
}

module.exports = mutateKeysSrcSync
