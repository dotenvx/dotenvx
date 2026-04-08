const t = require('tap')

const removeOptionsHelpParts = require('../../../src/lib/helpers/removeOptionsHelpParts')

t.test('#removeOptionsHelpParts', ct => {
  const lines = [
    'set [options] <KEY> <value>  set a single environment variable'
  ]

  removeOptionsHelpParts(lines)

  ct.same(lines, [
    'set <KEY> <value>  set a single environment variable'
  ])

  ct.end()
})

t.test('#removeOptionsHelpParts aligns command descriptions after [options] removal', ct => {
  const lines = [
    'Commands:',
    '  run [options]              inject env at runtime',
    '  get [KEY] [options]        return a single environment variable',
    '  login [options]            login via dotenvx-ops',
    '',
    'Advanced:'
  ]

  removeOptionsHelpParts(lines)

  ct.same(lines, [
    'Commands:',
    '  run        inject env at runtime',
    '  get [KEY]  return a single environment variable',
    '  login      login via dotenvx-ops',
    '',
    'Advanced:'
  ])

  ct.end()
})
