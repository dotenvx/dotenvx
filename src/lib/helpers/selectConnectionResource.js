const GetConnectionResources = require('../api/getConnectionResources')
const prompts = require('./prompts')

async function selectConnectionResource (hostname, token, team, connection, context) {
  const api = new GetConnectionResources(hostname, token, team, connection.id)
  let query = ''
  while (true) {
    const { resources, meta } = await api.run(query)
    const footer = !resources.length
      ? (query ? `No resources found for "${query}".` : 'No resources available for this connection.')
      : (meta?.has_more ? 'Showing 5 resources. Search to narrow the results.' : undefined)
    const shown = resources.slice(0, 5)
    const selected = await prompts.select({
      message: 'Select resource',
      footer,
      prefix: '◊',
      choices: [
        ...shown.map(resource => {
          const contextName = connection.name || resource.organization
          const name = resource.name || String(resource.id)
          const label = contextName ? `${contextName}${name.startsWith('/') ? ' ' : ' / '}${name}` : name
          return { name: label, value: String(resource.id) }
        }),
        { name: query ? 'Search again…' : 'Search…', value: '__search' },
        { name: '← back', value: '__back' }
      ],
      navigation: true,
      backValue: '__back'
    }, context)
    if (selected === '__back') return
    if (selected === '__search') {
      query = (await prompts.input({ message: 'Search resources (blank to reset)' }, context)).trim()
      continue
    }
    const resource = shown.find(resource => String(resource.id) === selected)
    if (!resource) throw new Error('Invalid resource selection')
    return resource
  }
}

module.exports = selectConnectionResource
