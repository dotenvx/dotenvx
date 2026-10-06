const Session = require('../../../../db/session')
const { armor } = require('@dotenvx/providers')
const { version } = require('../../../helpers/packageJson')
const armoredKeyDisplay = require('../../../helpers/armoredKeyDisplay')
const listenForOpenKey = require('../../../helpers/listenForOpenKey')
const openUrl = require('../../../helpers/openUrl')

async function index (publicKeyHex, options = {}) {
  const sesh = new Session()

  const hostname = sesh.hostname()
  const token = options.token || sesh.token()
  const devicePublicKey = sesh.devicePublicKey()

  const providerOptions = { hostname, token, devicePublicKey, cliVersion: version }
  let cleanupOpenKeyListener = () => {}
  if (options.onStatus) {
    providerOptions.onApprovalRequired = ({ approvalUri, code }) => {
      const keyDisplay = armoredKeyDisplay(publicKeyHex)
      const keySuffix = keyDisplay ? ` (${keyDisplay})` : ''
      options.onStatus(`[${code}] press Enter to open [${approvalUri}] and approve${keySuffix}`)
      cleanupOpenKeyListener = listenForOpenKey(() => openUrl(approvalUri))
    }
  }

  try {
    return await armor(providerOptions).get(publicKeyHex)
  } finally {
    cleanupOpenKeyListener()
  }
}

module.exports = index
