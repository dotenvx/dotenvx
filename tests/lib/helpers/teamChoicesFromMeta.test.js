const t = require('tap')
const teamChoicesFromMeta = require('../../../src/lib/helpers/teamChoicesFromMeta')

t.test('maps organizations to prompt choices', ct => {
  const meta = {
    organizations: [
      { provider_slug: 'dotenvx' },
      { provider_slug: 'motdotla' }
    ]
  }

  ct.same(teamChoicesFromMeta(meta), [
    { name: 'dotenvx', value: 'dotenvx' },
    { name: 'motdotla', value: 'motdotla' }
  ])

  ct.end()
})
