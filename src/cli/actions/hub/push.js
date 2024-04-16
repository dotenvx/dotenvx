const fs = require('fs')
const path = require('path')
const { request } = require('undici')

const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')
const createSpinner = require('./../../../shared/createSpinner')

const isGitRepo = require('./../../../lib/helpers/isGitRepo')
const isGithub = require('./../../../lib/helpers/isGithub')
const gitUrl = require('./../../../lib/helpers/gitUrl')
const gitRoot = require('./../../../lib/helpers/gitRoot')
const extractUsernameName = require('./../../../lib/helpers/extractUsernameName')
const sleep = require('./../../../lib/helpers/sleep')
const forgivingDirectory = require('./../../../lib/helpers/forgivingDirectory')

const spinner = createSpinner('pushing')

// constants
const ENCODING = 'utf8'

// Create a simple-git instance for the current directory
async function push (directory) {
  spinner.start()
  await sleep(500) // better dx

  directory = forgivingDirectory(directory)

  // debug args
  logger.debug(`directory: ${directory}`)

  // debug opts
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // must be a git repo
  if (!isGitRepo()) {
    spinner.fail('oops, must be a git repository')
    logger.help('? create one with [git init .]')
    process.exit(1)
  }
  // must be a git root
  const gitroot = gitRoot()
  if (!gitroot) {
    spinner.fail('oops, could not determine git repository\'s root')
    logger.help('? create one with [git init .]')
    process.exit(1)
  }
  // must have a remote origin url
  const giturl = gitUrl()
  if (!giturl) {
    spinner.fail('oops, must have a remote origin (git remote -v)')
    logger.help('? create it at [github.com/new] and then run [git remote add origin git@github.com:username/repository.git]')
    process.exit(1)
  }
  // must be a github remote
  if (!isGithub(giturl)) {
    spinner.fail('oops, must be a github.com remote origin (git remote -v)')
    logger.help('? create it at [github.com/new] and then run [git remote add origin git@github.com:username/repository.git]')
    logger.help2('ℹ need support for other origins? [please tell us](https://github.com/dotenvx/dotenvx/issues)')
    process.exit(1)
  }

  const envKeysFilepath = path.join(directory, '.env.keys')
  if (!fs.existsSync(envKeysFilepath)) {
    spinner.fail('oops, missing .env.keys file')
    logger.help(`? generate one with [dotenvx encrypt${directory ? ` ${directory}` : ''}]`)
    logger.help2('ℹ a .env.keys file holds decryption keys for a .env.vault file')
    process.exit(1)
  }

  const hostname = options.hostname
  const pushUrl = `${hostname}/v1/push`
  const oauthToken = store.getToken()
  const dotenvKeysContent = fs.readFileSync(envKeysFilepath, ENCODING)
  const usernameName = extractUsernameName(giturl)
  const relativeEnvKeysFilepath = path.relative(gitroot, path.join(process.cwd(), directory, '.env.keys')).replace(/\\/g, '/') // smartly determine path/to/.env.keys file from repository root - where user is cd-ed inside a folder or at repo root

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
        filepath: relativeEnvKeysFilepath
      })
    })

    const responseData = await response.body.json()

    if (response.statusCode >= 400) {
      logger.http(responseData)
      spinner.fail(responseData.error.message)
      if (response.statusCode === 404) {
        logger.help(`? try visiting [${hostname}/gh/${usernameName}] in your browser`)
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
