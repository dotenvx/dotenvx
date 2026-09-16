const prompts = require('./prompts')
const custodians = require('../custodians')

async function selectKeyStorage (options = {}) {
  const defaultStorage = custodians.get('native').enabled(options) ? 'native' : 'file'
  if (process.env.CI || options.noCreate || !process.stdin.isTTY || !process.stderr.isTTY) return defaultStorage

  const localChoices = await custodians.choices(options)

  const choices = [{ name: '⛉ Local Custody', value: 'local', disabled: false }]
  if (!options.noArmor) choices.push({ name: '⛊ Managed Custody', value: 'managed' })

  const context = { input: process.stdin, output: process.stderr }
  const custody = await prompts.select({
    message: 'Choose private key storage',
    choices
  }, context)

  return prompts.select({
    message: custody === 'local' ? 'Choose local custody' : 'Choose managed custody',
    choices: custody === 'local' ? localChoices : [{ name: '⛨ Armor', value: 'armored' }]
  }, context)
}

module.exports = selectKeyStorage
