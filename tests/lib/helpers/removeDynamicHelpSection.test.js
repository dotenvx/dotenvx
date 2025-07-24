const t = require('tap')

const removeDynamicHelpSection = require('../../../src/lib/helpers/removeDynamicHelpSection')

t.test('#removeDynamicHelpSection', ct => {
  const lines = [
    'Usage: dotenvx [options] [command] [command] [args...]',
    '',
    'a secure dotenv–from the creator of `dotenv`',
    '',
    'Arguments:',
    '  command                      dynamic command',
    '  args                         dynamic command arguments',
    '',
    'Options:'
  ]

  removeDynamicHelpSection(lines)

  ct.same(lines, [
    'Usage: dotenvx [options] [command] [command] [args...]',
    '',
    'a secure dotenv–from the creator of `dotenv`',
    '',
    'Options:'
  ])

  ct.end()
})
