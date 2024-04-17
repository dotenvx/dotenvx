const t = require('tap')

const forgivingDirectory = require('../../../src/lib/helpers/forgivingDirectory')

t.test('#forgivingDirectory as .env.keys file', ct => {
  const directory = forgivingDirectory('backend/.env.keys')

  ct.same(directory, 'backend')

  ct.end()
})

t.test('#forgivingDirectory directory', ct => {
  const directory = forgivingDirectory('backend/')

  ct.same(directory, 'backend/')

  ct.end()
})

t.test('#forgivingDirectory directory without backslash', ct => {
  const directory = forgivingDirectory('backend')

  ct.same(directory, 'backend')

  ct.end()
})

t.test('#forgivingDirectory root .env.keys', ct => {
  const directory = forgivingDirectory('.env.keys')

  ct.same(directory, '.')

  ct.end()
})
