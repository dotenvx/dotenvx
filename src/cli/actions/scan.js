const execa = require('execa')

const logger = require('./../../shared/logger')

async function scan () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    await execa('gitleaks', ['version'])
  } catch (error) {
    logger.error('gitleaks command not found')
    logger.help('? install gitleaks:      [brew install gitleaks]')
    logger.help2('? other install options: [https://github.com/gitleaks/gitleaks]')
    process.exit(1)
  }

  try {
    const { stderr } = await execa('gitleaks', ['detect', '-v'])
    logger.blank(stderr) // gitleaks sends output as stderr for strange reason
  } catch (error) {
    logger.error(error.message)
    process.exit(1)
  }
}

module.exports = scan
