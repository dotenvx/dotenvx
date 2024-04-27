const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function status () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const { changes, nochanges } = main.status()

  const changeFilepaths = []
  const nochangeFilepaths = []

  for (const row of nochanges) {
    nochangeFilepaths.push(row.filepath)
  }

  if (nochangeFilepaths.length > 0) {
    logger.blank(`no changes (${nochangeFilepaths.join(', ')})`)
  }

  for (const row of changes) {
    changeFilepaths.push(row.filepath)
  }

  if (changeFilepaths.length > 0) {
    logger.warn(`changes (${changeFilepaths.join(', ')})`)
  }

  for (const row of changes) {
    logger.blank('')
    const padding = '    '
    logger.blank(`${padding}\`\`\`${row.filepath}`)
    const paddedResult = row.coloredDiff.split('\n').map(line => padding + line).join('\n')
    console.log(paddedResult)
    logger.blank(`${padding}\`\`\``)
  }
}

module.exports = status
