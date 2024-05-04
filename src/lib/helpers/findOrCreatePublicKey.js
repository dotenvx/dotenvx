const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { PrivateKey } = require('eciesjs')

const guessEnvironment = require('./guessEnvironment')

const ENCODING = 'utf8'

function findOrCreatePublicKey (filepath) {
  const src = fs.readFileSync(filepath, { encoding: ENCODING })
  const parsed = dotenv.parse(src)

  // look for already present DOTENV_PUBLIC_KEY
  if (parsed.DOTENV_PUBLIC_KEY && parsed.DOTENV_PUBLIC_KEY.length > 0) {
    return {
      src: src,
      publicKey: parsed.DOTENV_PUBLIC_KEY,
      privateKey: null
    }
  }

  // generate key pair
  const keyPair = new PrivateKey()
  const publicKey = keyPair.publicKey.toHex()
  const privateKey = keyPair.secret.toString('hex')

  // format privateKey name
  const environment = guessEnvironment(filepath)
  let keyName = `DOTENV_PRIVATE_KEY_${environment.toUpperCase()}`
  if (filepath.endsWith('.env')) {
    keyName = 'DOTENV_PRIVATE_KEY'
  }
  let newKeysSrc = `${keyName}="${privateKey}"\n`

  // write privateKey to .env.keys
  const envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
  if (fs.existsSync(envKeysFilepath)) {
    const keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
    newKeysSrc = `${keysSrc}${newKeysSrc}`
  }

  fs.writeFileSync(envKeysFilepath, newKeysSrc)

  // write publicKey to .env* file
  const prependPublicKey = [
    '#------------------------------------------------------------------------------------',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '#------------------------------------------------------------------------------------',
    ''
  ].join('\n')
  const newSrc = `${prependPublicKey}\n${src}`
  fs.writeFileSync(filepath, newSrc)

  return {
    src: newSrc,
    keysSrc: newKeysSrc,
    publicKey: keyPair.publicKey.toHex(),
    privateKey: keyPair.secret.toString('hex')
  }
}

module.exports = findOrCreatePublicKey
