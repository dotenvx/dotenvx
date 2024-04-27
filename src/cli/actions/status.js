const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function status (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const { changes, nochanges } = main.status(directory)

  const changeFilenames = []
  const nochangeFilenames = []

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
}

module.exports = status
