const prompts = require('./prompts')
const custodians = require('../custodians')
const createSpinner = require('./createSpinner')

const nativeNames = { darwin: 'macOS Keychain', win32: 'Windows Credential Manager', linux: 'Linux Secret Service' }

async function selectKeyStorage (options = {}) {
  const defaultStorage = custodians.get('native').enabled(options) ? 'native' : 'file'
  if (process.env.CI || options.noCreate || !process.stdin.isTTY || !process.stderr.isTTY) return defaultStorage

  const groups = new Map()
  const setup = new Map()
  const definitions = [
    ['local', ['file', 'native']],
    ['passwords', ['onepassword', 'bitwarden']],
    ['armored', ['armored']]
  ]
  for (const [group, ids] of definitions) {
    const entries = []
    for (const id of ids) {
      const custodian = custodians.get(id)
      if (!custodian.enabled(options)) continue
      let name = id === 'native' ? nativeNames[process.platform] : id === 'file' ? `File ${options.fk || '.env.keys'}` : id === 'armored' ? '⛨ Dotenvx Armor' : custodian.name
      if (!await custodian.available()) {
        const command = id === 'onepassword' ? 'op' : 'bw'
        name += ' (install CLI)'
        setup.set(id, `Install the ${custodian.name} CLI (${command}), then retry this command.`)
      } else if (id === 'armored' && !await custodian.configured(options)) {
        name += ' (sign in)'
        setup.set(id, 'Sign in with [dotenvx armor login], then retry this command.')
      }
      entries.push({ name, value: id })
    }
    if (entries.length) groups.set(group, entries)
  }

  createSpinner.pause()
  try {
    const context = { input: process.stdin, output: process.stderr }
    const choices = [
      { name: '⛉ Local', value: 'local' },
      ...(groups.get('armored') || []),
      ...(groups.has('passwords') ? [{ name: '⛊ Password Managers', value: 'passwords' }] : [])
    ]
    let initial = 'local'
    while (true) {
      const category = await prompts.select({ message: 'Choose private key custody', choices, navigation: true, initial }, context)
      if (!choices.some(choice => choice.value === category)) throw new Error('Invalid private key storage selection')
      let storage = category
      if (category !== 'armored') {
        const entries = groups.get(category)
        storage = await prompts.select({
          message: category === 'local' ? 'Choose local custody' : 'Choose password manager',
          prefix: category === 'local' ? '⛉' : '⛊',
          choices: [...entries, { name: '← back', value: '__back' }],
          navigation: true,
          backValue: '__back'
        }, context)
        if (storage === '__back') {
          initial = category
          continue
        }
        if (!entries.some(choice => choice.value === storage)) throw new Error('Invalid private key storage selection')
      }
      if (setup.has(storage)) throw new Error(setup.get(storage))
      return storage
    }
  } finally {
    createSpinner.resume()
  }
}

module.exports = selectKeyStorage
