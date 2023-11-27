const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawn } = require('child_process')

const RESERVED_ENV_FILES = ['.env.vault', '.env.projects', '.env.keys', '.env.me', '.env.x']

// resolve path based on current running process location
const resolvePath = function (filepath) {
  return path.resolve(process.cwd(), filepath)
}

const executeCommand = function (subCommand, env) {
  const subprocess = spawn(subCommand[0], subCommand.slice(1), {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env }
  })

  subprocess.on('close', (code) => {
    process.exit(code)
  })

  subprocess.on('error', (_err) => {
    process.exit(1)
  })
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

const guessEnvironment = function (file) {
  const splitFile = file.split('.')
  const possibleEnvironment = splitFile[2] // ['', 'env', environment']

  if (!possibleEnvironment || possibleEnvironment.length === 0) {
    return 'development'
  }

  return possibleEnvironment
}

const generateDotenvKey = function (environment) {
  const rand = crypto.randomBytes(32).toString('hex')

  return `dotenv://:key_${rand}@dotenvx.com/vault/.env.vault?environment=${environment.toLowerCase()}`
}

module.exports = {
  resolvePath,
  executeCommand,
  pluralize,
  findEnvFiles,
  guessEnvironment,
  generateDotenvKey
}
