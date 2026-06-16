const dotenvx = require('../main')
const prompts = require('../helpers/prompts')
const PostArmorUp = require('../api/postArmorUp')
const keyNamesForEnvFile = require('../helpers/keyResolution/keyNamesForEnvFile')
const removeEnvKey = require('../helpers/removeEnvKey')

function teamChoicesFromMeta (meta) {
  return meta.organizations.map(org => ({
    name: org.provider_slug,
    value: org.provider_slug
  }))
}

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
    } = keyNamesForEnvFile(envFile)

    const publicKey = dotenvx.get(publicKeyName, { path: envFile, strict: true, ignore: ['MISSING_PRIVATE_KEY'], noArmor: true })
    const privateKey = dotenvx.get(privateKeyName, { path: '.env.keys', strict: true, ignore: ['MISSING_KEY'], noArmor: true })

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
