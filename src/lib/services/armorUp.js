const prompts = require('../helpers/prompts')
const resolveLocalKey = require('../custodians/resolveLocalKey')
const PostArmorUp = require('../api/postArmorUp')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')
const isTeamRequiredError = require('../helpers/isTeamRequiredError')

class ArmorUp {
  constructor (hostname, token, devicePublicKey, envFile = '.env', team = undefined) {
    this.hostname = hostname
    this.token = token
    this.devicePublicKey = devicePublicKey
    this.envFile = envFile
    this.team = team
  }

  async run () {
    const hostname = this.hostname
    const token = this.token
    const devicePublicKey = this.devicePublicKey
    const envFile = this.envFile
    const team = this.team

    const source = await resolveLocalKey(envFile, { allowMissing: true })
    const { publicKey, privateKey, privateKeyName } = source

    let json

    if (team) {
      json = await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, team).run()
    } else {
      try {
        json = await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, undefined).run()
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

        json = await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, team).run()
      }
    }

    await source.remove()

    return {
      ...json,
      changed: Boolean(json.changed || privateKey),
      privateKeyName,
      privateKeyValue: json.private_key,
      publicKeyValue: publicKey
    }
  }
}

module.exports = ArmorUp
