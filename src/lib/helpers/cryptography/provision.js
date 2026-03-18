const path = require('path')
const fsx = require('./../fsx')
const preserveShebang = require('./../preserveShebang')
const prependPublicKey = require('./../prependPublicKey')
const deriveKeypair = require('./deriveKeypair')
const { keyNames } = require('../keyResolution')

function provision ({ envSrc, envFilepath, keysFilepath }) {
  const filename = path.basename(envFilepath)
  const filepath = path.resolve(envFilepath)
  let resolvedKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
  if (keysFilepath) {
    resolvedKeysFilepath = path.resolve(keysFilepath)
  }
  const relativeFilepath = path.relative(path.dirname(filepath), resolvedKeysFilepath)

  const { publicKeyName, privateKeyName } = keyNames(envFilepath)
  const { publicKey, privateKey } = deriveKeypair()

  // build new envSrc
  const ps = preserveShebang(envSrc)
  const prependedPublicKey = prependPublicKey(publicKeyName, publicKey, filename, relativeFilepath)
  envSrc = `${ps.firstLinePreserved}${prependedPublicKey}\n${ps.envSrc}`

  // build keys src
  const firstTimeKeysSrc = [
    '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
    '#/ private decryption keys. DO NOT commit to source control /',
    '#/     [how it works](https://dotenvx.com/encryption)       /',
    // '#/           backup with: `dotenvx ops backup`              /',
    '#/----------------------------------------------------------/'
  ].join('\n')
  const appendPrivateKey = [
    `# ${filename}`,
    `${privateKeyName}=${privateKey}`,
    ''
  ].join('\n')
  let keysSrc = ''
  if (fsx.existsSync(resolvedKeysFilepath)) {
    keysSrc = fsx.readFileX(resolvedKeysFilepath)
  }
  keysSrc = keysSrc.length > 1 ? keysSrc : `${firstTimeKeysSrc}\n`
  keysSrc = `${keysSrc}\n${appendPrivateKey}`

  fsx.writeFileX(resolvedKeysFilepath, keysSrc)

  return {
    envSrc,
    keysSrc,
    publicKey,
    privateKey,
    privateKeyAdded: true,
    envKeysFilepath: keysFilepath || path.join(path.dirname(envFilepath), path.basename(resolvedKeysFilepath))
  }
}

module.exports = provision
