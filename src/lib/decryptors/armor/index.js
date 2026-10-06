const Session = require('../../../db/session')
const { armor } = require('@dotenvx/providers')
const { version } = require('../../helpers/packageJson')

async function index (src, options = {}) {
  const sesh = new Session()

  const hostname = sesh.hostname()
  const token = options.token || sesh.token()
  const devicePublicKey = sesh.devicePublicKey()

  return await armor({
    hostname,
    token,
    devicePublicKey,
    cliVersion: version
  }).decrypt(src, { publicKey: options.publicKey, grantToken: options.grantToken })
}

module.exports = index
