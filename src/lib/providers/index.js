const Session = require('./../../db/session')

const armorProvider = require('./armor/index')
const custodians = require('../custodians')

function syncArmorProvider (publicKeyHex) {
  const { createSyncFn } = require('@dotenvx/tooling')
  const runProviderSync = createSyncFn(require.resolve('./provider-worker.js'))
  return runProviderSync(publicKeyHex)
}

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

function armorProviderForOptions (options) {
  return (publicKeyHex) => armorProvider(publicKeyHex, {
    onStatus: options.onStatus,
    token: options.token,
    command: options.command
  })
}

function useArmor (options, noArmor) {
  return options.noArmor !== true && options.armor !== false && !noArmor
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

  if (options.noArmor !== true && options.armor !== false) {
    const sesh = new Session()
    const noArmor = !options.token && await sesh.noArmor()
    if (useArmor(options, noArmor)) {
      providerFns.push(armorProviderForOptions(options))
    }
  }

  return providerFrom(providerFns, composeProviders)
}

providers.sync = function providersSync (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) {
    return options.provider
  }

  const providerFns = custodians.providers(options, true)

  if (options.noArmor !== true && options.armor !== false) {
    const sesh = new Session()
    const noArmor = !options.token && sesh.noArmorSync()
    if (useArmor(options, noArmor)) {
      providerFns.push(syncArmorProvider)
    }
  }

  return providerFrom(providerFns, composeProvidersSync)
}

module.exports = providers
