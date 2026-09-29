const Session = require('../../../../db/session')
const PostArmorUp = require('../../../api/postArmorUp')
const prompts = require('../../../helpers/prompts')
const teamChoicesFromMeta = require('../../../helpers/teamChoicesFromMeta')
const isTeamRequiredError = require('../../../helpers/isTeamRequiredError')

async function store (publicKey, privateKey, context = {}) {
  const sesh = new Session()
  const hostname = sesh.hostname()
  const token = context.token || sesh.token()
  const devicePublicKey = sesh.devicePublicKey()

  try {
    await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, undefined).run()
  } catch (error) {
    if (!isTeamRequiredError(error)) {
      throw error
    }

    const choices = teamChoicesFromMeta(error.meta)

    let team = choices[0].value
    if (choices.length > 1) {
      team = await prompts.select({
        message: 'Select team',
        prefix: '⛨',
        choices: context.allowCustodyBack ? [...choices, { name: '← back', value: '__back' }] : choices,
        ...(context.allowCustodyBack ? { navigation: true, backValue: '__back' } : {})
      }, {
        input: process.stdin,
        output: process.stderr
      })
    }

    if (team === '__back') {
      const error = new Error('Return to private key custody')
      error.code = 'KEY_CUSTODY_BACK'
      throw error
    }

    await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, team).run()
  }
}

module.exports = store
