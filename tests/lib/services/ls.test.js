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
    'tests/monorepo-example/apps/frontend/.env',
    'tests/monorepo-example/apps/backend/.env.vault',
    'tests/monorepo-example/apps/backend/.env.keys',
    'tests/monorepo-example/apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#run (with directory argument)', ct => {
  const ls = new Ls('./tests/monorepo-example/')

  const envFiles = ls.run()

  const expected = [
    'apps/frontend/.env',
    'apps/backend/.env.vault',
    'apps/backend/.env.keys',
    'apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#run (with someow malformed directory argument)', ct => {
  const ls = new Ls('tests/monorepo-example')

  const envFiles = ls.run()

  const expected = [
    'apps/frontend/.env',
    'apps/backend/.env.vault',
    'apps/backend/.env.keys',
    'apps/backend/.env'
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
    'tests/monorepo-example/apps/frontend/.env',
    'tests/monorepo-example/apps/backend/.env.vault',
    'tests/monorepo-example/apps/backend/.env.keys',
    'tests/monorepo-example/apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#_patterns', ct => {
  const ls = new Ls()

  const patterns = ls._patterns()

  const expected = '**/.env*'

  ct.same(patterns, expected)

  ct.end()
})

t.test('#_patterns (envFile set to string)', ct => {
  const ls = new Ls(undefined, '.env')

  const patterns = ls._patterns()

  const expected = '**/.env'

  ct.same(patterns, expected)

  ct.end()
})

t.test('#_patterns (envFile set to array)', ct => {
  const ls = new Ls(undefined, ['.env.keys'])

  const patterns = ls._patterns()

  const expected = ['**/.env.keys']

  ct.same(patterns, expected)

  ct.end()
})
