const fs = require('fs')
const { execSync } = require('child_process')
const { request } = require('undici')

const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')
const helpers = require('./../../helpers')
const createSpinner = require('./../../../shared/createSpinner')

const spinner = createSpinner('pushing')

// constants
const ENCODING = 'utf8'

function isGitRepository () {
  try {
    // Redirect standard error to null to suppress Git error messages
    const result = execSync('git rev-parse --is-inside-work-tree 2> /dev/null').toString().trim()
    return result === 'true'
  } catch (_error) {
    return false
  }
}

function isGithub (url) {
  return url.includes('github.com')
}

// Create a simple-git instance for the current directory
async function push () {
  spinner.start()
  await helpers.sleep(500) // better dx

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const hostname = options.hostname
  const pushUrl = `${hostname}/v1/push`
  const keysFilename = '.env.keys'
  const vaultFilename = '.env.vault'

  if (!isGitRepository()) {
    spinner.fail('oops, must be a git repository')
    logger.help('? create one with [git init .]')
    process.exit(1)
  }

  const remoteOriginUrl = helpers.getRemoteOriginUrl()
  if (!remoteOriginUrl) {
    spinner.fail('oops, must have a remote origin (git remote -v)')
    logger.help('? create it at [github.com/new] and then run [git remote add origin git@github.com:username/repository.git]')
    process.exit(1)
  }

  if (!isGithub(remoteOriginUrl)) {
    spinner.fail('oops, must be a github.com remote origin (git remote -v)')
    logger.help('? create it at [github.com/new] and then run [git remote add origin git@github.com:username/repository.git]')
    logger.help2('ℹ need support for other origins? [please tell us](https://github.com/dotenvx/dotenvx/issues)')
    process.exit(1)
  }

  if (!fs.existsSync(keysFilename)) {
    spinner.fail('oops, missing .env.keys file')
    logger.help('? generate one with [dotenvx encrypt]')
    logger.help2('ℹ a .env.keys file holds decryption keys for a .env.vault file')
    process.exit(1)
  }

  if (!fs.existsSync(vaultFilename)) {
    spinner.fail('oops, missing .env.vault file')
    logger.help('? generate one with [dotenvx encrypt]')
    logger.help2('ℹ a .env.vault file holds encrypted secrets per environment')
    process.exit(1)
  }

  const oauthToken = store.getToken()
  const dotenvKeysContent = fs.readFileSync(keysFilename, ENCODING)
  const dotenvVaultContent = fs.readFileSync(vaultFilename, ENCODING)
  const usernameName = helpers.extractUsernameName(remoteOriginUrl)

  try {
    const response = await request(pushUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username_name: usernameName,
        DOTENV_KEYS: dotenvKeysContent,
        DOTENV_VAULT: dotenvVaultContent
      })
    })

    const responseData = await response.body.json()

    if (response.statusCode >= 400) {
      logger.http(responseData)
      spinner.fail(responseData.error.message)
      if (response.statusCode === 404) {
        logger.help(`? try visiting [${hostname}gh/${usernameName}] in your browser`)
      }
      process.exit(1)
    }
  } catch (error) {
    spinner.fail(error.toString())
    process.exit(1)
  }

  spinner.succeed(`pushed [${usernameName}]`)
  logger.help2('ℹ run [dotenvx hub open] to view on hub')
}

module.exports = push
