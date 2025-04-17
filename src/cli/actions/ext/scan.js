const childProcess = require('child_process')

const { logger } = require('./../../../shared/logger')
const chomp = require('./../../../lib/helpers/chomp')

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

  let output = ''
  try {
    output = childProcess.execSync('gitleaks detect --no-banner --verbose 2>&1', { encoding: 'utf-8' }).toString() // gitleaks sends output as stderr for strange reason
    logger.blank(chomp(output))
  } catch (error) {
    if (error.stdout) {
      console.error(chomp(error.stdout.toString()))
    }

    process.exit(1)
  }
}

module.exports = scan
