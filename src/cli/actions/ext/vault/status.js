const { logger } = require('./../../../../shared/logger')

const main = require('./../../../../lib/main')

function status (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const { changes, nochanges, untracked } = main.status(directory)

    const changeFilenames = []
    const nochangeFilenames = []
    const untrackedFilenames = []

    for (const row of nochanges) {
      nochangeFilenames.push(row.filename)
    }

    if (nochangeFilenames.length > 0) {
      logger.blank(`no changes (${nochangeFilenames.join(', ')})`)
    }

    for (const row of changes) {
      changeFilenames.push(row.filename)
    }

    if (changeFilenames.length > 0) {
      logger.warn(`changes (${changeFilenames.join(', ')})`)
    }

    for (const row of changes) {
      logger.blank('')
      const padding = '    '
      logger.blank(`${padding}\`\`\`${row.filename}`)
      const paddedResult = row.coloredDiff.split('\n').map(line => padding + line).join('\n')
      console.log(paddedResult)
      logger.blank(`${padding}\`\`\``)
    }

    if (changeFilenames.length > 0) {
      logger.blank('')
      const optionalDirectory = directory === '.' ? '' : ` ${directory}`
      logger.blank(`run [dotenvx encrypt${optionalDirectory}] to apply changes to .env.vault`)
    }

    if (nochangeFilenames.length < 1 && changeFilenames.length < 1) {
      logger.warn('no .env* files.')
      logger.help('? add one with [echo "HELLO=World" > .env] and then run [dotenvx status]')
    }

    for (const row of untracked) {
      untrackedFilenames.push(row.filename)
    }

    if (untrackedFilenames.length > 0) {
      logger.warn(`untracked (${untrackedFilenames.join(', ')})`)
      logger.help(`? track them with [dotenvx encrypt ${directory}]`)
    }
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
    if (error.debug) {
      logger.debug(error.debug)
    }
    if (error.code) {
      logger.debug(`ERROR_CODE: ${error.code}`)
    }
    process.exit(1)
  }
}

module.exports = status
