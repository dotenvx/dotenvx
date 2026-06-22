const Session = require('../../../db/session')
const ArmorKeyring = require('../../services/armorKeyring')

async function index (publicKeyHex) {
  const sesh = new Session()

  const hostname = sesh.hostname()
  const token = sesh.token()
  const devicePublicKey = sesh.devicePublicKey()

  const json = await new ArmorKeyring(
    hostname,
    token,
    devicePublicKey,
    publicKeyHex
  ).run()

  return json['private_key']
}

module.exports = index
