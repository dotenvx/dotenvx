const openBrowser = require('open')
const { confirm } = require('@inquirer/prompts')

const createSpinner = require('./../../../shared/createSpinner')
const logger = require('./../../../shared/logger')
const helpers = require('./../../helpers')

async function open () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const hostname = options.hostname
  const remoteOriginUrl = helpers.getRemoteOriginUrl()
  const usernameName = helpers.extractUsernameName(remoteOriginUrl)

  const openUrl = `${hostname}/gh/${usernameName}`

  // optionally allow user to open browser
  const answer = await confirm({ message: `press Enter to open [${openUrl}]...` })

  if (answer) {
    const spinner = createSpinner('opening')
    spinner.start()

    await helpers.sleep(500) // better dx

    await openBrowser(openUrl)

    spinner.succeed(`opened [${usernameName}]`)
  }
}

module.exports = open
