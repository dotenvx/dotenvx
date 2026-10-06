const { provider } = require('@dotenvx/providers')
const bitwarden = require('../custodians/local/bitwarden')
const { version } = require('../helpers/packageJson')
const armoredKeyDisplay = require('../helpers/armoredKeyDisplay')
const listenForOpenKey = require('../helpers/listenForOpenKey')
const openUrl = require('../helpers/openUrl')

const nativeNames = { darwin: 'macosKeychain', win32: 'windowsCredentialManager', linux: 'linuxSecretService' }

function lookup (publicKey, options, sync) {
  let source
  let cleanup = () => {}
  const keys = provider({
    ...options,
    // File keys are already resolved against the selected env file by callers.
    fk: [],
    processEnv: bitwarden.commandEnv(),
    cliVersion: version,
    // The async CLI fallback can interactively unlock Bitwarden. The shared
    // synchronous path reads BW_SESSION without prompting.
    noBitwarden: sync ? options.noBitwarden : true,
    onLookup (name) { source = name },
    onApprovalRequired: options.onStatus && (({ approvalUri, code }) => {
      cleanup()
      const display = armoredKeyDisplay(publicKey)
      options.onStatus(`[${code}] press Enter to open [${approvalUri}] and approve${display ? ` (${display})` : ''}`)
      cleanup = listenForOpenKey(() => openUrl(approvalUri))
    })
  })

  function found (ring) {
    if (ring[publicKey] && options.onProvider) {
      options.onProvider(source === 'native' ? nativeNames[process.platform] || source : source, publicKey)
    }
    return ring
  }

  if (sync) {
    try { return found(keys.getSync(publicKey)) } finally { cleanup() }
  }

  return (async () => {
    try {
      let ring = await keys.get(publicKey)
      if (!ring[publicKey] && bitwarden.enabled(options)) {
        source = 'bitwarden'
        ring = await bitwarden.get(publicKey)
      }
      return found(ring)
    } finally {
      cleanup()
    }
  })()
}

async function providers (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) return options.provider
  return publicKey => lookup(publicKey, options, false)
}

providers.sync = function (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) return options.provider
  return publicKey => lookup(publicKey, options, true)
}

module.exports = providers
