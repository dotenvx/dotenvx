const truncate = require('./truncate')

class Errors {
  constructor (options = {}) {
    this.filepath = options.filepath
    this.envFilepath = options.envFilepath

    this.key = options.key
    this.privateKey = options.privateKey
    this.privateKeyName = options.privateKeyName
    this.command = options.command

    this.message = options.message
  }

  missingEnvFile () {
    const code = 'MISSING_ENV_FILE'
    const message = `[${code}] missing ${this.envFilepath} file (${this.filepath})`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/484`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  missingKey () {
    const code = 'MISSING_KEY'
    const message = `[${code}] missing ${this.key} key`

    const e = new Error(message)
    e.code = code
    return e
  }

  missingPrivateKey () {
    const code = 'MISSING_PRIVATE_KEY'
    const message = `[${code}] could not decrypt ${this.key} using private key '${this.privateKeyName}=${truncate(this.privateKey)}'`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/464`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  invalidPrivateKey () {
    const code = 'INVALID_PRIVATE_KEY'
    const message = `[${code}] could not decrypt ${this.key} using private key '${this.privateKeyName}=${truncate(this.privateKey)}'`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/465`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  looksWrongPrivateKey () {
    const code = 'WRONG_PRIVATE_KEY'
    const message = `[${code}] could not decrypt ${this.key} using private key '${this.privateKeyName}=${truncate(this.privateKey)}'`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/466`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  malformedEncryptedData () {
    const code = 'MALFORMED_ENCRYPTED_DATA'
    const message = `[${code}] could not decrypt ${this.key} because encrypted data appears malformed`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/467`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  decryptionFailed () {
    const code = 'DECRYPTION_FAILED'
    const message = this.message

    const e = new Error(message)
    e.code = code
    return e
  }

  commandSubstitutionFailed () {
    const code = 'COMMAND_SUBSTITUTION_FAILED'
    const message = `[${code}] could not eval ${this.key} containing command '${this.command}': ${this.message}`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/532`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  dangerousDependencyHoist () {
    const code = 'DANGEROUS_DEPENDENCY_HOIST'
    const message = `[${code}] your environment has hoisted an incompatible version of a dotenvx dependency: ${this.message}`
    const help = `[${code}] https://github.com/dotenvx/dotenvx/issues/622`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  // GPG-specific errors
  missingGpgRecipient () {
    const code = 'MISSING_GPG_RECIPIENT'
    const message = `[${code}] GPG recipient (key ID or email) is required`
    const help = `[${code}] Set DOTENV_GPG_KEY environment variable or use --gpg-key flag`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  gpgNotAvailable () {
    const code = 'GPG_NOT_AVAILABLE'
    const message = `[${code}] gpg command not found`
    const help = `[${code}] Install GnuPG: https://gnupg.org/download/`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  gpgEncryptionFailed () {
    const code = 'GPG_ENCRYPTION_FAILED'
    const message = `[${code}] GPG encryption failed: ${this.message}`
    const help = `[${code}] Check GPG key availability: gpg --list-keys`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  gpgDecryptionFailed () {
    const code = 'GPG_DECRYPTION_FAILED'
    const message = `[${code}] Unable to decrypt '${this.key}': ${this.message}`
    const help = `[${code}] Ensure YubiKey is inserted and correct PIN is used`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  yubiKeyNotPresent () {
    const code = 'YUBIKEY_NOT_PRESENT'
    const message = `[${code}] YubiKey required for decryption of '${this.key}'`
    const help = `[${code}] Insert your YubiKey and try again`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  gpgBadPin () {
    const code = 'GPG_BAD_PIN'
    const message = `[${code}] Incorrect PIN for decryption of '${this.key}'`
    const help = `[${code}] Enter correct PIN. After 3 failed attempts, YubiKey may be locked.`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }
}

module.exports = Errors
