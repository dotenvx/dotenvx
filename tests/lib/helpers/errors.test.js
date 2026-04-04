const t = require('tap')

const Errors = require('../../../src/lib/helpers/errors')

t.test('#errors dangerousDependencyHoist', ct => {
  const result = new Errors({ message: 'hi' }).dangerousDependencyHoist()

  t.equal(result.code, 'DANGEROUS_DEPENDENCY_HOIST')
  t.equal(result.message, '[DANGEROUS_DEPENDENCY_HOIST] your environment has hoisted an incompatible version of a dotenvx dependency: hi')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/622]')

  ct.end()
})

t.test('#errors custom with code auto-fix and debug', ct => {
  const result = new Errors({
    message: 'boom',
    code: 'MISSING_ENV_FILE',
    debug: 'trace'
  }).custom()

  t.equal(result.code, 'MISSING_ENV_FILE')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/484]')
  t.equal(result.messageWithHelp, 'boom. fix: [https://github.com/dotenvx/dotenvx/issues/484]')
  t.equal(result.debug, 'trace')

  ct.end()
})

t.test('#errors custom with explicit help and no code', ct => {
  const result = new Errors({
    message: 'boom',
    help: 'custom help'
  }).custom()

  t.equal(result.code, undefined)
  t.equal(result.help, 'custom help')
  t.equal(result.messageWithHelp, 'boom. custom help')

  ct.end()
})

t.test('#errors missingEnvFile falls back to .env', ct => {
  const result = new Errors({}).missingEnvFile()

  t.equal(result.code, 'MISSING_ENV_FILE')
  t.equal(result.message, '[MISSING_ENV_FILE] missing file (.env)')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/484]')
  t.equal(result.messageWithHelp, '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]')

  ct.end()
})

t.test('#errors missingEnvKeysFile falls back to .env.keys', ct => {
  const result = new Errors({}).missingEnvKeysFile()

  t.equal(result.code, 'MISSING_ENV_KEYS_FILE')
  t.equal(result.message, '[MISSING_ENV_KEYS_FILE] missing file (.env.keys)')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/484]')
  t.equal(result.messageWithHelp, '[MISSING_ENV_KEYS_FILE] missing file (.env.keys). fix: [https://github.com/dotenvx/dotenvx/issues/484]')

  ct.end()
})
