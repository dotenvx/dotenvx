const { setTimeout: delay } = require('node:timers/promises')
const GetTeamConnections = require('../api/getTeamConnections')
const TeamConnectionSetup = require('../api/teamConnectionSetup')
const prompts = require('./prompts')
const openUrl = require('./openUrl')

async function selectConnection (hostname, token, team, service, context) {
  const { connections } = await new GetTeamConnections(hostname, token, team, service.slug).run()
  const selected = await prompts.select({
    message: 'Select connection',
    prefix: '◊',
    choices: [
      ...connections.map(connection => ({ name: connection.name, value: String(connection.id) })),
      { name: `+ Connect to ${service.name}`, value: '__connect' },
      { name: '← back', value: '__back' }
    ],
    navigation: true,
    backValue: '__back'
  }, context)
  if (selected === '__back') return
  if (selected !== '__connect') {
    const connection = connections.find(connection => String(connection.id) === selected)
    if (!connection) throw new Error('Invalid connection selection')
    return connection
  }

  const api = new TeamConnectionSetup(hostname, token, team)
  const setup = await api.create(service.slug)
  const url = new URL(setup.setup_url, hostname)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid connection setup URL')
  context.output.write(`◇ waiting for ${service.name} connection…\n${url.href}\n`)
  try {
    await openUrl(url.href)
  } catch {
    context.output.write(`Open the URL above to connect ${service.name}.\n`)
  }
  const deadline = Math.min(Date.parse(setup.expires_at), Date.now() + 10 * 60 * 1000)
  while (Date.now() < deadline) {
    const result = await api.status(setup.id)
    if (result.status === 'connected') {
      if (!result.connection || result.connection.service !== service.slug) throw new Error('Invalid connection response')
      return result.connection
    }
    if (result.status === 'expired') break
    if (result.status !== 'pending') throw new Error(`${service.name} connection setup failed`)
    await delay(Math.min(5000, Math.max(1000, (setup.interval || 2) * 1000)))
  }
  throw new Error(`${service.name} connection setup expired. Select Connect to ${service.name} to try again.`)
}

module.exports = selectConnection
