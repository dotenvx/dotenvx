const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.test('ls calls Ls.run', ct => {
  const envFiles = dotenvx.ls()

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
