const dotenvx = require('../main')
const prompts = require('../helpers/prompts')
const PostArmorMove = require('../api/postArmorMove')
const GetAccount = require('../api/getAccount')
const keyNamesForEnvFile = require('../helpers/keyResolution/keyNamesForEnvFile')

class ArmorMove {
  constructor (hostname, token, devicePublicKey, envFile = '.env') {
    this.hostname = hostname
    this.token = token
    this.devicePublicKey = devicePublicKey
    this.envFile = envFile

    this.team = null // implement
  }

  async run () {
    const hostname = this.hostname
    const token = this.token
    const devicePublicKey = this.devicePublicKey
    const envFile = this.envFile
    let team = this.team

    const {
      publicKeyName,
      privateKeyName
    } = keyNamesForEnvFile(envFile)
    const publicKey = dotenvx.get(publicKeyName, { path: envFile, strict: true, ignore: ['MISSING_PRIVATE_KEY'], noArmor: true })

    const accountJson = await new GetAccount(hostname, token).run()
    const choices = accountJson.organizations.map(o => ({
      name: o.provider_slug,
      value: o.provider_slug
    }))
    team = await prompts.select({
      message: 'Select team',
      choices
    }, {
      input: process.stdin,
      output: process.stderr
    })

    const json = await new PostArmorMove(hostname, token, devicePublicKey, publicKey, team).run()

    return {
      ...json,
      privateKeyName,
      privateKeyValue: json.private_key,
      publicKeyValue: publicKey
    }
  }
}

module.exports = ArmorMove
