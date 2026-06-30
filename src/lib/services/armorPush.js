const { derive } = require('@dotenvx/primitives')
const prompts = require('../helpers/prompts')
const PostArmorPush = require('../api/postArmorPush')
const keynames = require('../conventions/keynames')
const readEnvKey = require('../helpers/readEnvKey')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')

function publicKeyFromPrivateKey (privateKey) {
  try {
    return derive(privateKey)
  } catch {
    return ''
  }
}

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

    const { privateKeyName } = keynames(envFile)

    const privateKey = readEnvKey(privateKeyName, '.env.keys', { strict: true })
    const publicKey = publicKeyFromPrivateKey(privateKey)

    let json

    if (team) {
      json = await new PostArmorPush(hostname, token, devicePublicKey, privateKey, team).run()
    } else {
      try {
        json = await new PostArmorPush(hostname, token, devicePublicKey, privateKey, undefined).run()
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
