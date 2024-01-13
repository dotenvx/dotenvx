const fs = require('fs')
const path = require('path')
const execa = require('execa')
const crypto = require('crypto')
const { execSync } = require('child_process')
const xxhash = require('xxhashjs')

const XXHASH_SEED = 0xABCD
const NONCE_BYTES = 12

const main = require('./../lib/main')
const logger = require('./../shared/logger')

const RESERVED_ENV_FILES = ['.env.vault', '.env.projects', '.env.keys', '.env.me', '.env.x']
const REPORT_ISSUE_LINK = 'https://github.com/dotenvx/dotenvx/issues/new'

const sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// resolve path based on current running process location
const resolvePath = function (filepath) {
  return path.resolve(process.cwd(), filepath)
}

const executeCommand = async function (commandArgs, env) {
  const signals = [
    'SIGHUP', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
  ]

  logger.debug(`executing process command [${commandArgs.join(' ')}]`)

  // handler for SIGINT
  let commandProcess
  const sigintHandler = () => {
    logger.debug('received SIGINT')
    logger.debug('checking command process')
    logger.debug(commandProcess)

    if (commandProcess) {
      logger.debug('sending SIGINT to command process')
      commandProcess.kill('SIGINT') // Send SIGINT to the command process
    } else {
      logger.debug('no command process to send SIGINT to')
    }
  }

  const handleOtherSignal = (signal) => {
    logger.debug(`received ${signal}`)
  }

  try {
    commandProcess = execa(commandArgs[0], commandArgs.slice(1), {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    })

    process.on('SIGINT', sigintHandler)

    signals.forEach(signal => {
      process.on(signal, () => handleOtherSignal(signal))
    })

    // Wait for the command process to finish
    const { exitCode } = await commandProcess

    if (exitCode !== 0) {
      logger.debug(`received exitCode ${exitCode}`)
      throw new Error(`Command failed with exit code ${exitCode}`)
    }
  } catch (error) {
    if (error.signal !== 'SIGINT') {
      logger.error(error.message)
      logger.error(`command [${commandArgs.join(' ')}] failed`)
      logger.error('')
      logger.error(`  try without dotenvx: [${commandArgs.join(' ')}]`)
      logger.error('')
      logger.error('if that succeeds, then dotenvx is the culprit. report issue:')
      logger.error(`<${REPORT_ISSUE_LINK}>`)
    }

    // Exit with the error code from the command process, or 1 if unavailable
    process.exit(error.exitCode || 1)
  } finally {
    // Clean up: Remove the SIGINT handler
    process.removeListener('SIGINT', sigintHandler)
  }
}

const pluralize = function (word, count) {
  // simple pluralization: add 's' at the end
  if (count === 0 || count > 1) {
    return word + 's'
  } else {
    return word
  }
}

const findEnvFiles = function (directory) {
  const files = fs.readdirSync(directory)

  const envFiles = files.filter(file =>
    file.startsWith('.env') &&
    !file.endsWith('.previous') &&
    !RESERVED_ENV_FILES.includes(file)
  )

  return envFiles
}

const guessEnvironment = function (filepath) {
  const filename = path.basename(filepath)
  const parts = filename.split('.')
  const possibleEnvironment = parts[2] // ['', 'env', environment', 'previous']

  if (!possibleEnvironment || possibleEnvironment.length === 0) {
    return 'development'
  }

  return possibleEnvironment
}

const generateDotenvKey = function (environment) {
  const rand = crypto.randomBytes(32).toString('hex')

  return `dotenv://:key_${rand}@dotenvx.com/vault/.env.vault?environment=${environment.toLowerCase()}`
}

const encryptFile = function (filepath, dotenvKey, encoding) {
  const key = _parseEncryptionKeyFromDotenvKey(dotenvKey)
  const message = fs.readFileSync(filepath, encoding)

  const ciphertext = encrypt(key, message)

  return ciphertext
}

const encrypt = function (key, message) {
  // set up nonce
  const nonce = crypto.randomBytes(NONCE_BYTES)

  // set up cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce)

  // generate ciphertext
  let ciphertext = ''
  ciphertext += cipher.update(message, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  ciphertext += cipher.getAuthTag().toString('hex')

  // prepend nonce
  ciphertext = nonce.toString('hex') + ciphertext

  // base64 encode output
  return Buffer.from(ciphertext, 'hex').toString('base64')
}

const changed = function (ciphertext, dotenvKey, filepath, encoding) {
  const key = _parseEncryptionKeyFromDotenvKey(dotenvKey)
  const decrypted = main.decrypt(ciphertext, key)
  const raw = fs.readFileSync(filepath, encoding)

  return hash(decrypted) !== hash(raw)
}

const hash = function (str) {
  return xxhash.h32(str, XXHASH_SEED).toString(16)
}

const _parseEncryptionKeyFromDotenvKey = function (dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (e) {
    throw new Error(`INVALID_DOTENV_KEY: ${e.message}`)
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    throw new Error('INVALID_DOTENV_KEY: Missing key part')
  }

  return Buffer.from(key.slice(-64), 'hex')
}

const _parseCipherTextFromDotenvKeyAndParsedVault = function (dotenvKey, parsedVault) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (e) {
    throw new Error(`INVALID_DOTENV_KEY: ${e.message}`)
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    throw new Error('INVALID_DOTENV_KEY: Missing environment part')
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = parsedVault[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    throw new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: cannot locate environment ${environmentKey} in your .env.vault file`)
  }

  return ciphertext
}

const formatCode = function (str) {
  const parts = []

  for (let i = 0; i < str.length; i += 4) {
    parts.push(str.substring(i, i + 4))
  }

  return parts.join('-')
}

const getRemoteOriginUrl = function () {
  try {
    const url = execSync('git remote get-url origin 2> /dev/null').toString().trim()
    return url
  } catch (_error) {
    return null
  }
}

const extractUsernameName = function (url) {
  // Removing the protocol part and splitting by slashes and colons
  // Removing the protocol part and .git suffix, then splitting by slashes and colons
  const parts = url.replace(/(^\w+:|^)\/\//, '').replace(/\.git$/, '').split(/[/:]/)

  // Extract the 'username/repository' part
  return parts.slice(-2).join('/')
}

module.exports = {
  sleep,
  resolvePath,
  executeCommand,
  pluralize,
  findEnvFiles,
  guessEnvironment,
  generateDotenvKey,
  encryptFile,
  encrypt,
  changed,
  hash,
  formatCode,
  getRemoteOriginUrl,
  extractUsernameName,
  _parseEncryptionKeyFromDotenvKey,
  _parseCipherTextFromDotenvKeyAndParsedVault
}
