const openBrowser = require('open')
const confirm = require('@inquirer/confirm').default

const createSpinner = require('./../../../shared/createSpinner')
const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')
const sleep = require('./../../../lib/helpers/sleep')

const username = store.getUsername()
const usernamePart = username ? ` [${username}]` : ''
const spinner = createSpinner(`logging off machine${usernamePart}`)

async function logout () {
  spinner.start()
  await sleep(500) // better dx

  // debug opts
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  logger.debug('deleting settings.DOTENVX_TOKEN')
  store.deleteToken()

  logger.debug('deleting settings.DOTENVX_HOSTNAME')
  store.deleteHostname()

  spinner.done(`logged off machine${usernamePart}`)

  const hostname = options.hostname
  const logoutUrl = `${hostname}/logout`

  // optionally allow user to open browser
  const answer = await confirm({ message: `press Enter to also log off browser [${logoutUrl}]...` })

  if (answer) {
    spinner.start()
    await sleep(500) // better dx
    await openBrowser(logoutUrl)
    spinner.done(`logged off browser${usernamePart}`)
  }
}

module.exports = logout
