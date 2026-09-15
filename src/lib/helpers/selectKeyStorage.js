const prompts = require('./prompts')

const secretStoreNames = {
  darwin: 'macOS Keychain',
  win32: 'Windows Credential Manager',
  linux: 'Linux Secret Service'
}

async function selectKeyStorage (options = {}) {
  const useNative = !options.noKeychain && !process.env.CI && ['darwin', 'linux', 'win32'].includes(process.platform)
  const defaultStorage = useNative ? 'native' : 'file'
  if (process.env.CI || options.noCreate || options.noArmor || !process.stdin.isTTY || !process.stderr.isTTY) return defaultStorage

  return prompts.select({
    message: 'Choose private key storage',
    choices: [
      ...(useNative ? [{ name: `□ Local Custody (${secretStoreNames[process.platform]})`, value: 'native' }] : []),
      { name: '⛨ Managed Custody (Armor)', value: 'armored' }
    ]
  }, { input: process.stdin, output: process.stderr })
}

module.exports = selectKeyStorage
