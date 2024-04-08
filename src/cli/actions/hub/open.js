const openBrowser = require('open')
const confirm = require('@inquirer/confirm').default

const createSpinner = require('./../../../shared/createSpinner')
const logger = require('./../../../shared/logger')

const isGitRepo = require('./../../../lib/helpers/isGitRepo')
const isGithub = require('./../../../lib/helpers/isGithub')
const gitUrl = require('./../../../lib/helpers/gitUrl')
const gitRoot = require('./../../../lib/helpers/gitRoot')
const extractUsernameName = require('./../../../lib/helpers/extractUsernameName')
const sleep = require('./../../../lib/helpers/sleep')

const spinner = createSpinner('opening')

async function open () {
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

  const usernameName = extractUsernameName(giturl)
  const openUrl = `${options.hostname}/gh/${usernameName}`

  // optionally allow user to open browser
  const answer = await confirm({ message: `press Enter to open [${openUrl}]...` })

  if (answer) {
    spinner.start()
    await sleep(500) // better dx
    await openBrowser(openUrl)
    spinner.succeed(`opened [${usernameName}]`)
  }
}

module.exports = open
