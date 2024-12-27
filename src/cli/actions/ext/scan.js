const childProcess = require('child_process')

const { logger } = require('./../../../shared/logger')

function scan () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    // redirect stderr to stdout to capture and ignore it
    childProcess.execSync('gitleaks version', { stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (error) {
    console.error('gitleaks: command not found')
    logger.help('? install gitleaks:      [brew install gitleaks]')
    logger.help('? other install options: [https://github.com/gitleaks/gitleaks]')
    process.exit(1)
    return
  }

  try {
    const output = childProcess.execSync('gitleaks detect -v 2>&1', { stdio: 'pipe' }).toString() // gitleaks sends output as stderr for strange reason
    logger.blank(output)
  } catch (error) {
    console.error(error.message)

    process.exit(1)
  }
}

module.exports = scan
