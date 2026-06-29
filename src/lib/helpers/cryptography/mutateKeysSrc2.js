const FIRST_TIME_KEYS_SRC = [
  '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
  '#/ private decryption keys. DO NOT commit to source control /',
  '#/     [how it works](https://dotenvx.com/encryption)       /',
  '#/          ⛨ ARMORED KEYS: `dotenvx armor up`              /',
  '#/----------------------------------------------------------/'
].join('\n')

function mutateKeysSrc2 ({ keysSrc, privateKeyName, privateKeyValue }) {
  const filename = '.env.keys'
  const appendPrivateKey = [`# ${filename}`, `${privateKeyName}=${privateKeyValue}`, ''].join('\n')

  keysSrc = keysSrc.length > 1 ? keysSrc : `${FIRST_TIME_KEYS_SRC}\n`
  keysSrc = `${keysSrc}\n${appendPrivateKey}`

  return {
    keysSrc
  }
}

module.exports = mutateKeysSrc2
