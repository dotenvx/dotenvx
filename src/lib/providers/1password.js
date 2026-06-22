async function provider (publicKey) {
  const json = {
    'dude': '1password!'
  }
  return json[publicKey]
}

module.exports = provider
