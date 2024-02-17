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
    'tests/.env',
    'tests/monorepo-example/apps/app2/.env',
    'tests/monorepo-example/apps/app1/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#run (with directory argument)', ct => {
  const ls = new Ls('./tests/monorepo-example/')

  const envFiles = ls.run()

  const expected = [
    'apps/app2/.env',
    'apps/app1/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#run (with someow malformed directory argument)', ct => {
  const ls = new Ls('tests/monorepo-example')

  const envFiles = ls.run()

  const expected = [
    'apps/app2/.env',
    'apps/app1/.env'
  ]

  ct.same(envFiles, expected)

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
    'tests/.env',
    'tests/monorepo-example/apps/app2/.env',
    'tests/monorepo-example/apps/app1/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})
