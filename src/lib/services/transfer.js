const path = require('node:path')
const fs = require('node:fs')
const custodians = require('../custodians')
const resolveLocalKey = require('../custodians/resolveLocalKey')
const keynames = require('../conventions/keynames')
const readEnvKey = require('../helpers/readEnvKey')
const upsertEnvKey = require('../helpers/upsertEnvKey')
const matchesStoredKey = require('../helpers/matchesStoredKey')
const selectKeyStorage = require('../helpers/selectKeyStorage')
const prompts = require('../helpers/prompts')
const Session = require('../../db/session')
const PostArmorPull = require('../api/postArmorPull')
const PostArmorDown = require('../api/postArmorDown')
const isTeamRequiredError = require('../helpers/isTeamRequiredError')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')

module.exports = async function transfer (envFile = '.env') {
  const { publicKeyName, privateKeyName } = keynames(envFile)
  const publicKey = readEnvKey(publicKeyName, envFile, { strict: true })
  const keysFilepath = path.resolve(path.dirname(envFile), '.env.keys')
  const sources = await resolveLocalKey(envFile, { all: true })
  const session = new Session()
  let team
  async function armor (Operation) {
    const call = () => new Operation(session.hostname(), session.token(), session.devicePublicKey(), publicKey, team).run()
    try { return await call() } catch (error) {
      if (!isTeamRequiredError(error) || team) throw error
      const choices = teamChoicesFromMeta(error.meta)
      team = choices.length === 1 ? choices[0].value : await prompts.select({ message: 'Select team', choices })
      return call()
    }
  }
  function verify (value) {
    if (!value || !matchesStoredKey(publicKey, value)) throw new Error('private key does not match the env public key')
    return value
  }

  let source
  if (sources.length > 1) {
    const index = await prompts.select({
      message: 'Private key found in multiple stores. Transfer from',
      choices: sources.map((source, index) => ({ name: source.name, value: String(index) }))
    })
    source = sources[Number(index)]
    if (!source) throw new Error('Invalid private key source')
  } else source = sources[0]

  if (!source) {
    if (!custodians.get('armored').enabled() || !await custodians.get('armored').configured()) {
      throw new Error(`private key ${privateKeyName} not found in local stores; sign in to check Dotenvx Armor`)
    }
    const { private_key: privateKey } = await armor(PostArmorPull)
    verify(privateKey)
    source = {
      id: 'armored',
      name: 'Dotenvx Armor',
      privateKey,
      async remove () {
        const current = await armor(PostArmorPull)
        if (current.private_key !== privateKey) throw new Error('private key changed; Armor was not modified')
        await armor(PostArmorDown)
      }
    }
  }

  const selection = await selectKeyStorage({
    fk: path.join(path.dirname(envFile), '.env.keys'),
    existingKey: true,
    message: `Transfer private key from ${source.name} to`
  })
  const destination = custodians.get(selection)
  const result = changed => ({ changed, publicKey, from: source.name, to: destination.name })
  if (selection === source.id) {
    if (selection !== 'file' || source.filepath === keysFilepath) return result(false)
    if (fs.existsSync(source.filepath) && fs.existsSync(keysFilepath)) {
      const from = fs.statSync(source.filepath)
      const to = fs.statSync(keysFilepath)
      if (from.dev === to.dev && from.ino === to.ino) return result(false)
    }
  }

  const privateKey = verify(source.privateKey)
  if (selection === 'file') {
    const existing = readEnvKey(privateKeyName, keysFilepath)
    if (existing && existing !== privateKey) throw new Error('destination contains a different private key; nothing was changed')
    upsertEnvKey(privateKeyName, privateKey, keysFilepath)
    if (readEnvKey(privateKeyName, keysFilepath, { strict: true }) !== privateKey) throw new Error('could not verify destination; source was not removed')
  } else if (selection === 'armored') {
    await destination.store(publicKey, privateKey, { envFilepath: envFile })
    if ((await armor(PostArmorPull)).private_key !== privateKey) throw new Error('could not verify destination; source was not removed')
  } else {
    const existing = (await destination.get(publicKey))?.[publicKey]
    if (existing && existing !== privateKey) throw new Error('destination contains a different private key; nothing was changed')
    if (!existing) await destination.set(publicKey, privateKey)
    if ((await destination.get(publicKey))?.[publicKey] !== privateKey) throw new Error('could not verify destination; source was not removed')
  }

  try { await source.remove() } catch (error) {
    throw new Error(`private key saved in ${destination.name}, but could not remove it from ${source.name}; both copies remain`, { cause: error })
  }
  return result(true)
}
