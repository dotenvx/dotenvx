const path = require('path')

const fsx = require('./../fsx')
const preserveShebang = require('./../preserveShebang')
const prependPublicKey = require('./../prependPublicKey')
const deriveKeypair = require('./deriveKeypair')
const { keyNames } = require('../keyResolution')

function provision ({ src, filepath, keysFilepath }) {
  const filename = path.basename(filepath)
  const relativeFilepath = path.relative(path.dirname(filepath), keysFilepath)
  const { publicKeyName, privateKeyName } = keyNames(envFilepath)

  const { publicKey, privateKey } = deriveKeypair()

  // build new src (envSrc)
  const ps = preserveShebang(src)
  const prependedPublicKey = prependPublicKey(publicKeyName, publicKey, filename, relativeFilepath)
  src = `${ps.firstLinePreserved}${prependedPublicKey}\n${ps.envSrc}`

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
  if (fsx.existsSync(keysFilepath)) {
    keysSrc = fsx.readFileX(keysFilepath)
  }
  keysSrc = keysSrc.length > 1 ? keysSrc : `${firstTimeKeysSrc}\n`
  keysSrc = `${keysSrc}\n${appendPrivateKey}`

  return {
    envSrc: src,
    publicKey,
    privateKey,
    privateKeyAdded: true,
    envKeysFilepath: (keysFilepath || path.join(path.dirname(filepath), path.basename(keysFilepath)))
  }
}

module.exports = provision
