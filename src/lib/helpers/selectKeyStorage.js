const prompts = require('./prompts')
const custodians = require('../custodians')
const createSpinner = require('./createSpinner')
const Session = require('../../db/session')
const GetTeams = require('../api/getTeams')
const GetTeamServices = require('../api/getTeamServices')
const selectConnection = require('./selectConnection')
const selectConnectionResource = require('./selectConnectionResource')

const nativeNames = { darwin: 'macOS Keychain', win32: 'Windows Credential Manager', linux: 'Linux Secret Service' }

async function selectKeyStorage (options = {}) {
  if (process.env.CI || options.noCreate || !process.stdin.isTTY || !process.stderr.isTTY) return 'file'

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
        setup.set(id, 'Sign in with [dotenvx login], then retry this command.')
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
      if (storage === 'armored') {
        while (true) {
          const keyType = await prompts.select({
            message: 'Choose key type',
            prefix: '⛨',
            choices: [
              { name: '⛨ Armored', value: 'armored' },
              { name: '◊ Enclaved', value: 'enclaved' },
              { name: '← back', value: '__back' }
            ],
            initial: 'armored',
            navigation: true,
            backValue: '__back'
          }, context)
          if (keyType === '__back') {
            initial = 'armored'
            break
          }
          if (keyType === 'enclaved') {
            const session = new Session()
            const { teams } = await new GetTeams(session.hostname(), options.token || session.token()).run()
            if (!teams.length) throw new Error('No teams available for enclave keys')
            const choices = teams.map(team => ({ name: team.slug, value: team.slug }))
            while (true) {
              const team = await prompts.select({
                message: 'Select team',
                prefix: '◊',
                choices: [...choices, { name: '← back', value: '__back' }],
                navigation: true,
                backValue: '__back'
              }, context)
              if (team === '__back') break
              if (!choices.some(choice => choice.value === team)) throw new Error('Invalid team selection')
              const { services } = await new GetTeamServices(session.hostname(), options.token || session.token(), team).run()
              if (!services.length) throw new Error('No services available for this team')
              const serviceChoices = services.map(service => ({ name: service.name, value: service.slug }))
              while (true) {
                const service = await prompts.select({
                  message: 'Select service',
                  prefix: '◊',
                  choices: [...serviceChoices, { name: '← back', value: '__back' }],
                  navigation: true,
                  backValue: '__back'
                }, context)
                if (service === '__back') break
                if (!serviceChoices.some(choice => choice.value === service)) throw new Error('Invalid service selection')
                const selectedService = services.find(item => item.slug === service)
                while (true) {
                  const connection = await selectConnection(session.hostname(), options.token || session.token(), team, selectedService, context)
                  if (!connection) break
                  const resource = await selectConnectionResource(session.hostname(), options.token || session.token(), team, connection, context)
                  if (!resource) continue
                  return { id: 'enclaved', team, service, connectionId: connection.id, resourceId: resource.id }
                }
              }
            }
            continue
          }
          if (keyType !== 'armored') throw new Error('Invalid key type selection')
          return storage
        }
        continue
      }
      return storage
    }
  } finally {
    createSpinner.resume()
  }
}

module.exports = selectKeyStorage
