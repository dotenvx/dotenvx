const prompts = require('./prompts')
const onePasswordCustody = require('./onePasswordCustody')
const bitwardenCustody = require('./bitwardenCustody')

const secretStoreNames = {
  darwin: 'macOS Keychain',
  win32: 'Windows Credential Manager',
  linux: 'Linux Secret Service'
}

async function selectKeyStorage (options = {}) {
  const useNative = !options.noNative && process.env.DOTENVX_NO_NATIVE !== 'true' && !process.env.CI && ['darwin', 'linux', 'win32'].includes(process.platform)
  const defaultStorage = useNative ? 'native' : 'file'
  if (process.env.CI || options.noCreate || !process.stdin.isTTY || !process.stderr.isTTY) return defaultStorage

  const use1Password = !options.no1Password && process.env.DOTENVX_NO_1PASSWORD !== 'true' && await onePasswordCustody.available()
  const useBitwarden = !options.noBitwarden && process.env.DOTENVX_NO_BITWARDEN !== 'true' && await bitwardenCustody.available()
  const localChoices = [
    { name: `OS${secretStoreNames[process.platform] ? ` (${secretStoreNames[process.platform]})` : ''}`, value: 'native', disabled: !useNative },
    { name: '1Password', value: 'onepassword', disabled: !use1Password },
    { name: 'Bitwarden', value: 'bitwarden', disabled: !useBitwarden },
    { name: 'File (.env.keys)', value: 'file', disabled: false }
  ]

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
