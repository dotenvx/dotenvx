const FIRST_TIME_KEYS_SRC = '# ⛉ private decryption keys (do not commit · ⇄ move with `dotenvx transfer`)'

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
