const fs = require('fs')
const { execSync } = require('child_process')
const axios = require('axios')

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

function getRemoteOriginUrl () {
  try {
    const url = execSync('git remote get-url origin 2> /dev/null').toString().trim()
    return url
  } catch (_error) {
    return null
  }
}

function isGithub (url) {
  return url.includes('github.com')
}

function extractUsernameRepository (url) {
  // Removing the protocol part and splitting by slashes and colons
  // Removing the protocol part and .git suffix, then splitting by slashes and colons
  const parts = url.replace(/(^\w+:|^)\/\//, '').replace(/\.git$/, '').split(/[/:]/)

  // Extract the 'username/repository' part
  return parts.slice(-2).join('/')
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

  if (!isGitRepository()) {
    spinner.fail('oops, must be a git repository')
    logger.help('? create one with [git init .]')
    process.exit(1)
  }

  const remoteOriginUrl = getRemoteOriginUrl()
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

  const oauthToken = store.getToken()
  const dotenvKeysContent = fs.readFileSync(keysFilename, ENCODING)
  const usernameRepository = extractUsernameRepository(remoteOriginUrl)

  try {
    const postData = {
      username_repository: usernameRepository,
      DOTENV_KEYS: dotenvKeysContent
    }
    const options = {
      headers: {
        Authorization: `Bearer ${oauthToken}`
      }
    }
    await axios.post(pushUrl, postData, options)
  } catch (error) {
    if (error.response && error.response.data) {
      logger.http(error.response.data)
      spinner.fail(error.response.data.error.message)
      if (error.response.status === 404) {
        logger.help(`? try visiting [${hostname}gh/${usernameRepository}] in your browser`)
      }
      process.exit(1)
    } else {
      spinner.fail(error.toString())
      process.exit(1)
    }
  }

  spinner.succeed(`pushed [${usernameRepository}]`)
}

module.exports = push
