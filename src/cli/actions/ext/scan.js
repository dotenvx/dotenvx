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
    logger.error('gitleaks: command not found')
    logger.help('fix: install gitleaks:      [brew install gitleaks]')
    logger.help('fix: other install options: [https://github.com/gitleaks/gitleaks]')
    return { exitCode: 1, error }
  }

  let output = ''
  try {
    output = childProcess.execSync('gitleaks detect --no-banner --verbose 2>&1').toString() // gitleaks sends exit code 1 but puts data on stdout for failures, so we catch later and resurface the stdout
    logger.info(chomp(output))
  } catch (error) {
    if (error.stdout) {
      logger.error(chomp(error.stdout.toString()))
    }

    return { exitCode: 1, error }
  }
}

module.exports = scan
