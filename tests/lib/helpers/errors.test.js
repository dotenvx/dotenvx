const t = require('tap')

const Errors = require('../../../src/lib/helpers/errors')

t.test('#errors', ct => {
  const result = new Errors({message: 'hi'}).dangerousDependencyHoist()

  t.equal(result.code, 'DANGEROUS_DEPENDENCY_HOIST')
  t.equal(result.message, '[DANGEROUS_DEPENDENCY_HOIST] your environment has hoisted an incompatible version of a dotenvx dependency: hi')
  t.equal(result.help, '[DANGEROUS_DEPENDENCY_HOIST] https://github.com/dotenvx/dotenvx/issues/622')

  ct.end()
})
