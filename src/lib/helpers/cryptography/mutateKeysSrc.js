const FIRST_TIME_KEYS_SRC = [
  '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
  '#/ private decryption keys. DO NOT commit to source control /',
  '#/     [how it works](https://dotenvx.com/encryption)       /',
  '#/          ⛨ ARMORED KEYS: `dotenvx armor up`              /',
  '#/----------------------------------------------------------/'
].join('\n')

function mutateKeysSrc ({ keysSrc, privateKeyName, privateKeyValue, comment }) {
  const appendPrivateKey = [`# ${comment}`, `${privateKeyName}=${privateKeyValue}`, ''].join('\n')

  if (!keysSrc || keysSrc.length < 1) {
    keysSrc = `${FIRST_TIME_KEYS_SRC}\n`
  }
  keysSrc = `${keysSrc}\n${appendPrivateKey}`

  return {
    keysSrc
  }
}

module.exports = mutateKeysSrc
