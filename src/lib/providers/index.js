const custodians = require('../custodians')

function hasKey (keyring, publicKeyHex) {
  return keyring && keyring[publicKeyHex]
}

function composeProviders (providerFns) {
  return async function provider (publicKeyHex) {
    for (const providerFn of providerFns) {
      const keyring = await providerFn(publicKeyHex)
      if (hasKey(keyring, publicKeyHex)) return keyring
    }

    return {}
  }
}

function composeProvidersSync (providerFns) {
  return function providerSync (publicKeyHex) {
    for (const providerFn of providerFns) {
      const keyring = providerFn(publicKeyHex)
      if (hasKey(keyring, publicKeyHex)) return keyring
    }

    return {}
  }
}

function providerFrom (providerFns, compose) {
  if (providerFns.length === 0) return null
  if (providerFns.length === 1) return providerFns[0]

  return compose(providerFns)
}

async function providers (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) {
    return options.provider
  }

  const providerFns = custodians.providers(options)

  const armor = custodians.get('armored')
  if (armor.enabled(options) && await armor.configured(options)) {
    providerFns.push(async publicKey => {
      const ring = await armor.get(publicKey, options)
      if (hasKey(ring, publicKey) && options.onProvider) options.onProvider('armor', publicKey)
      return ring
    })
  }

  return providerFrom(providerFns, composeProviders)
}

providers.sync = function providersSync (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) {
    return options.provider
  }

  const providerFns = custodians.providers(options, true)

  const armor = custodians.get('armored')
  if (armor.enabled(options) && armor.configuredSync(options)) {
    providerFns.push(publicKey => {
      const ring = armor.getSync(publicKey)
      if (hasKey(ring, publicKey) && options.onProvider) options.onProvider('armor', publicKey)
      return ring
    })
  }

  return providerFrom(providerFns, composeProvidersSync)
}

module.exports = providers
