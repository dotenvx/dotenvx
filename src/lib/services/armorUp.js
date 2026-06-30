const prompts = require('../helpers/prompts')
const PostArmorUp = require('../api/postArmorUp')
const keynames = require('../conventions/keynames')
const removeEnvKey = require('../helpers/removeEnvKey')
const readEnvKey = require('../helpers/readEnvKey')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')

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

    const {
      publicKeyName,
      privateKeyName
    } = keynames(envFile)

    const publicKey = readEnvKey(publicKeyName, envFile, { strict: true, ignore: ['MISSING_PRIVATE_KEY'] })
    const privateKey = readEnvKey(privateKeyName, '.env.keys', { strict: true, ignore: ['MISSING_KEY'] })

    let json

    if (team) {
      json = await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, team).run()
    } else {
      try {
        json = await new PostArmorUp(hostname, token, devicePublicKey, publicKey, privateKey, undefined).run()
      } catch (error) {
        if (error.code !== 'DOTENVX_TEAM_REQUIRED') {
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

    removeEnvKey(privateKeyName)

    return {
      ...json,
      changed: json.changed,
      privateKeyName,
      privateKeyValue: json.private_key,
      publicKeyValue: publicKey
    }
  }
}

module.exports = ArmorUp
