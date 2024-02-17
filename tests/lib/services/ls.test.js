const t = require('tap')

const Ls = require('../../../src/lib/services/ls')

t.test('#run', ct => {
  const ls = new Ls()

  const envFiles = ls.run()

  const expected = [
    'tests/.env.vault',
    'tests/.env.multiline',
    'tests/.env.local',
    'tests/.env.expand',
    'tests/.env'
  ]

  t.same(envFiles, expected)

  ct.end()
})

t.test('#_filepaths', ct => {
  const ls = new Ls()

  const envFiles = ls._filepaths()

  const expected = [
    'tests/.env.vault',
    'tests/.env.multiline',
    'tests/.env.local',
    'tests/.env.expand',
    'tests/.env'
  ]

  t.same(envFiles, expected)

  ct.end()
})
