const Session = require('../../../../db/session')
const PostArmorUp = require('../../../api/postArmorUp')
const prompts = require('../../../helpers/prompts')
const teamChoicesFromMeta = require('../../../helpers/teamChoicesFromMeta')
const isTeamRequiredError = require('../../../helpers/isTeamRequiredError')

async function store (publicKey, privateKey) {
  const sesh = new Session()
  const hostname = sesh.hostname()
  const token = sesh.token()
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
        choices
      }, {
        input: process.stdin,
        output: process.stderr
      })
    }

    await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, team).run()
  }
}

module.exports = store
