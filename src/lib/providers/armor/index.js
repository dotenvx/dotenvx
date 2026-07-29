const Session = require('../../../db/session')
const ArmorKeyring = require('../../services/armorKeyring')
const armoredKeyDisplay = require('../../helpers/armoredKeyDisplay')
const isNetworkError = require('../../helpers/isNetworkError')
const listenForOpenKey = require('../../helpers/listenForOpenKey')
const openUrl = require('../../helpers/openUrl')

async function index (publicKeyHex, options = {}) {
  const sesh = new Session()

  const hostname = sesh.hostname()
  const token = sesh.token()
  const devicePublicKey = sesh.devicePublicKey()

  const keyring = new ArmorKeyring(
    hostname,
    token,
    devicePublicKey,
    publicKeyHex
  )
  let cleanupOpenKeyListener = () => {}
  if (options.onStatus) {
    keyring.onApprovalRequired = ({ approvalUri, code }) => {
      const keyDisplay = armoredKeyDisplay(publicKeyHex)
      const keySuffix = keyDisplay ? ` (${keyDisplay})` : ''
      options.onStatus(`[${code}] press Enter to open [${approvalUri}] and approve${keySuffix}`)
      cleanupOpenKeyListener = listenForOpenKey(() => openUrl(approvalUri))
    }
  }

  try {
    return await keyring.run() // { "publicKey": "privateKey" }
  } catch (error) {
    if (isNetworkError(error)) {
      return {}
    }

    throw error
  } finally {
    cleanupOpenKeyListener()
  }
}

module.exports = index
