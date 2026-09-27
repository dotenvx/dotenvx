const prompts = require('../helpers/prompts')
const resolveLocalKey = require('../custodians/resolveLocalKey')
const PostArmorPush = require('../api/postArmorPush')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')
const isTeamRequiredError = require('../helpers/isTeamRequiredError')

class ArmorPush {
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

    const source = await resolveLocalKey(envFile)
    const { publicKey, privateKey, privateKeyName } = source

    let json

    if (team) {
      json = await new PostArmorPush(hostname, token, devicePublicKey, privateKey, team).run()
    } else {
      try {
        json = await new PostArmorPush(hostname, token, devicePublicKey, privateKey, undefined).run()
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

        json = await new PostArmorPush(hostname, token, devicePublicKey, privateKey, team).run()
      }
    }

    return {
      ...json,
      changed: json.changed,
      privateKeyName,
      privateKeyValue: json.private_key,
      publicKeyValue: publicKey
    }
  }
}

module.exports = ArmorPush
