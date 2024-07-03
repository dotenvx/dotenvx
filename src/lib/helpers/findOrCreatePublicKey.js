const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const keyPair = require('./keyPair')
const guessPublicKeyName = require('./guessPublicKeyName')
const guessPrivateKeyName = require('./guessPrivateKeyName')

const ENCODING = 'utf8'

function findOrCreatePublicKey (envFilepath, envKeysFilepath) {
  // filename
  const filename = path.basename(envFilepath)
  const publicKeyName = guessPublicKeyName(envFilepath)
  const privateKeyName = guessPrivateKeyName(envFilepath)

  // src
  let envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
  let keysSrc = ''
  if (fs.existsSync(envKeysFilepath)) {
    keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
  }

  // parsed
  const envParsed = dotenv.parse(envSrc)
  const keysParsed = dotenv.parse(keysSrc)
  const existingPrivateKey = keysParsed[privateKeyName]

  // if DOTENV_PUBLIC_KEY_${environment} already present then go no further
  if (envParsed[publicKeyName] && envParsed[publicKeyName].length > 0) {
    return {
      envSrc,
      keysSrc,
      publicKey: envParsed[publicKeyName],
      privateKey: existingPrivateKey,
      privateKeyAdded: false
    }
  }

  // generate key pair
  const { publicKey, privateKey } = keyPair(existingPrivateKey)

  // publicKey
  const prependPublicKey = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `${publicKeyName}="${publicKey}"`,
    '',
    `# ${filename}`
  ].join('\n')

  // privateKey
  const firstTimeKeysSrc = [
    '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
    '#/ private decryption keys. DO NOT commit to source control /',
    '#/     [how it works](https://dotenvx.com/encryption)       /',
    '#/----------------------------------------------------------/'
  ].join('\n')
  const appendPrivateKey = [
    `# ${filename}`,
    `${privateKeyName}="${privateKey}"`,
    ''
  ].join('\n')

  envSrc = `${prependPublicKey}\n${envSrc}`
  keysSrc = keysSrc.length > 1 ? keysSrc : `${firstTimeKeysSrc}\n`
  keysSrc = `${keysSrc}\n${appendPrivateKey}`

  let privateKeyAdded = false
  if (!existingPrivateKey) {
    privateKeyAdded = true
  }

  return {
    envSrc,
    keysSrc,
    publicKey,
    privateKey,
    privateKeyAdded
  }
}

module.exports = findOrCreatePublicKey
