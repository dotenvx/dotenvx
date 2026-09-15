const prompts = require('./prompts')
const onePasswordCustody = require('./onePasswordCustody')
const bitwardenCustody = require('./bitwardenCustody')

const secretStoreNames = {
  darwin: 'macOS Keychain',
  win32: 'Windows Credential Manager',
  linux: 'Linux Secret Service'
}

async function selectKeyStorage (options = {}) {
  const useNative = !options.noKeychain && !process.env.CI && ['darwin', 'linux', 'win32'].includes(process.platform)
  const defaultStorage = useNative ? 'native' : 'file'
  if (process.env.CI || options.noCreate || !process.stdin.isTTY || !process.stderr.isTTY) return defaultStorage

  const choices = [
    ...(useNative ? [{ name: `□ Local Custody (Native ${secretStoreNames[process.platform]})`, value: 'native' }] : [])
  ]
  if (!options.no1Password && process.env.DOTENVX_NO_1PASSWORD !== 'true' && await onePasswordCustody.available()) {
    choices.push({ name: '□ Local Custody (1Password)', value: 'onepassword' })
  }
  if (!options.noBitwarden && process.env.DOTENVX_NO_BITWARDEN !== 'true' && await bitwardenCustody.available()) {
    choices.push({ name: '□ Local Custody (Bitwarden)', value: 'bitwarden' })
  }
  if (!options.noArmor) choices.push({ name: '⛨ Managed Custody (Armor)', value: 'armored' })
  if (choices.length < 2) return choices.length ? choices[0].value : defaultStorage

  return prompts.select({
    message: 'Choose private key storage',
    choices
  }, { input: process.stdin, output: process.stderr })
}

module.exports = selectKeyStorage
