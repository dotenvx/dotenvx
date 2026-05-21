const { logger } = require('./../../shared/logger')
const main = require('./../../lib/main')

function doctor (directory = '.') {
  logger.debug(`directory: ${directory}`)

  const findings = main.doctor(directory)
  logger.debug(`findings: ${JSON.stringify(findings)}`)

  if (findings.length === 0) {
    logger.info('no dotenv loaders found')
    return
  }

  logger.warn(`found ${findings.length} possible dotenv loader${findings.length === 1 ? '' : 's'}`)

  for (const finding of findings) {
    logger.info(`│ ${finding.filepath}:${finding.line}: ${finding.code}`)
  }
}

module.exports = doctor
