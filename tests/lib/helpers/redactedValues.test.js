const t = require('tap')

const redactedValues = require('../../../src/lib/helpers/redactedValues')

t.test('redactedValues follows Envfile rules rather than key naming', ct => {
  const values = redactedValues([
    {
      injected: {
        SECRET: 'super-secret',
        PUBLIC: 'public-value',
        VISIBLE_PLAIN: 'visible-value',
        EMPTY: ''
      }
    },
    {
      injected: { INLINE: 'inline-value' },
      existed: {
        EXISTING: 'external-value',
        EXISTING_PLAIN: 'external-visible-value'
      }
    }
  ], { exists: true, redacted: true, redactionRules: new Map([['PUBLIC', false], ['VISIBLE_PLAIN', false]]) })

  ct.same(values, ['super-secret', 'inline-value', 'external-value', 'external-visible-value'])
  ct.end()
})

t.test('redactedValues does not select values without an Envfile', ct => {
  const rows = [{ injected: { SECRET: 'test-secret' } }]
  ct.same(redactedValues(rows), [])
  ct.same(redactedValues(rows, { exists: false }), [])
  ct.end()
})
