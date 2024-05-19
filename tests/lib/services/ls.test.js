const t = require('tap')

const Ls = require('../../../src/lib/services/ls')

t.test('#run', ct => {
  const ls = new Ls('./tests')

  const envFiles = ls.run()

  const expected = [
    '.env.vault',
    '.env.multiline',
    '.env.local',
    '.env.expand',
    '.env.eval',
    '.env',
    'monorepo/apps/unencrypted/.env',
    'monorepo/apps/multiline/.env',
    'monorepo/apps/frontend/.env',
    'monorepo/apps/encrypted/.env.keys',
    'monorepo/apps/encrypted/.env',
    'monorepo/apps/backend/.env.vault',
    'monorepo/apps/backend/.env.untracked',
    'monorepo/apps/backend/.env.previous',
    'monorepo/apps/backend/.env.keys',
    'monorepo/apps/backend/.env.example',
    'monorepo/apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#run (with directory argument)', ct => {
  const ls = new Ls('./tests/monorepo/')

  const envFiles = ls.run()

  const expected = [
    'apps/unencrypted/.env',
    'apps/multiline/.env',
    'apps/frontend/.env',
    'apps/encrypted/.env.keys',
    'apps/encrypted/.env',
    'apps/backend/.env.vault',
    'apps/backend/.env.untracked',
    'apps/backend/.env.previous',
    'apps/backend/.env.keys',
    'apps/backend/.env.example',
    'apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#run (with somehow malformed directory argument)', ct => {
  const ls = new Ls('tests/monorepo')

  const envFiles = ls.run()

  const expected = [
    'apps/unencrypted/.env',
    'apps/multiline/.env',
    'apps/frontend/.env',
    'apps/encrypted/.env.keys',
    'apps/encrypted/.env',
    'apps/backend/.env.vault',
    'apps/backend/.env.untracked',
    'apps/backend/.env.previous',
    'apps/backend/.env.keys',
    'apps/backend/.env.example',
    'apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('#_filepaths', ct => {
  const ls = new Ls('./tests')

  const envFiles = ls._filepaths()

  const expected = [
    '.env.vault',
    '.env.multiline',
    '.env.local',
    '.env.expand',
    '.env.eval',
    '.env',
    'monorepo/apps/unencrypted/.env',
    'monorepo/apps/multiline/.env',
    'monorepo/apps/frontend/.env',
    'monorepo/apps/encrypted/.env.keys',
    'monorepo/apps/encrypted/.env',
    'monorepo/apps/backend/.env.vault',
    'monorepo/apps/backend/.env.untracked',
    'monorepo/apps/backend/.env.previous',
    'monorepo/apps/backend/.env.keys',
    'monorepo/apps/backend/.env.example',
    'monorepo/apps/backend/.env'
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
