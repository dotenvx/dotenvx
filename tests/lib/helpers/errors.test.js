const t = require('tap')

const Errors = require('../../../src/lib/helpers/errors')

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

t.test('#errors onePasswordFailed', ct => {
  const result = new Errors({ message: '1Password CLI failed to resolve API_KEY' }).onePasswordFailed()

  t.equal(result.code, '1PASSWORD_FAILED')
  t.equal(result.message, '[1PASSWORD_FAILED] 1Password CLI failed to resolve API_KEY')
  t.equal(result.help, 'fix: [https://www.1password.dev/cli/get-started]')
  t.equal(result.messageWithHelp, '[1PASSWORD_FAILED] 1Password CLI failed to resolve API_KEY. fix: [https://www.1password.dev/cli/get-started]')

  ct.end()
})

t.test('#errors bitwardenFailed', ct => {
  const result = new Errors({ message: 'Bitwarden Password Manager CLI failed to resolve API_KEY' }).bitwardenFailed()

  t.equal(result.code, 'BITWARDEN_FAILED')
  t.equal(result.message, '[BITWARDEN_FAILED] Bitwarden Password Manager CLI failed to resolve API_KEY')
  t.equal(result.help, 'fix: [https://bitwarden.com/help/cli/]')
  t.equal(result.messageWithHelp, '[BITWARDEN_FAILED] Bitwarden Password Manager CLI failed to resolve API_KEY. fix: [https://bitwarden.com/help/cli/]')

  ct.end()
})

t.test('#errors missingEnvKeysFile falls back to .env.keys', ct => {
  const result = new Errors({}).missingEnvKeysFile()

  t.equal(result.code, 'MISSING_ENV_KEYS_FILE')
  t.equal(result.message, '[MISSING_ENV_KEYS_FILE] missing file (.env.keys)')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/775]')
  t.equal(result.messageWithHelp, '[MISSING_ENV_KEYS_FILE] missing file (.env.keys). fix: [https://github.com/dotenvx/dotenvx/issues/775]')

  ct.end()
})

t.test('#errors missingPublicKey', ct => {
  const result = new Errors({}).missingPublicKey()

  t.equal(result.code, 'MISSING_PUBLIC_KEY')
  t.equal(result.message, '[MISSING_PUBLIC_KEY] missing public key')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/865]')
  t.equal(result.messageWithHelp, '[MISSING_PUBLIC_KEY] missing public key. fix: [https://github.com/dotenvx/dotenvx/issues/865]')

  ct.end()
})

t.test('#errors fileNotWritable', ct => {
  const result = new Errors({ filepath: 'C:\\Windows\\System32\\.env.keys' }).fileNotWritable()

  t.equal(result.code, 'FILE_NOT_WRITABLE')
  t.equal(result.message, '[FILE_NOT_WRITABLE] cannot write to file (C:\\Windows\\System32\\.env.keys)')
  t.equal(result.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/890]')
  t.equal(result.messageWithHelp, '[FILE_NOT_WRITABLE] cannot write to file (C:\\Windows\\System32\\.env.keys). fix: [https://github.com/dotenvx/dotenvx/issues/890]')

  ct.end()
})
