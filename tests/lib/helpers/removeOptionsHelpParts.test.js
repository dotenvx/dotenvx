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
    '  login [options]            login via dotenvx-armor',
    '',
    'Advanced:'
  ]

  removeOptionsHelpParts(lines)

  ct.same(lines, [
    'Commands:',
    '  run        inject env at runtime',
    '  get [KEY]  return a single environment variable',
    '  login      login via dotenvx-armor',
    '',
    'Advanced:'
  ])

  ct.end()
})

t.test('#removeOptionsHelpParts hides the Options section', ct => {
  const lines = [
    'Usage: dotenvx run -- yourcommand',
    '',
    'Options:',
    '  -l, --log-level <level>  set log level (default: "info")',
    '  -q, --quiet              sets log level to error',
    '  -v, --verbose            sets log level to verbose',
    '  -d, --debug              sets log level to debug',
    '  -V, --version            output the version number',
    '  -h, --help               display help for command',
    '',
    'Commands:',
    '  run [options]  inject env at runtime'
  ]

  removeOptionsHelpParts(lines)

  ct.same(lines, [
    'Usage: dotenvx run -- yourcommand',
    '',
    'Commands:',
    '  run  inject env at runtime'
  ])

  ct.end()
})
