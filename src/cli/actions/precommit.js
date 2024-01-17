const fs = require('fs')
const path = require('path')

const ignore = require('ignore')

const logger = require('./../../shared/logger')
const helpers = require('./../helpers')

function precommit () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // 0. handle the --install flag
  if (options.install) {
    installPrecommitHook()
    return
  }

  // 1. check for .gitignore file
  if (!fs.existsSync('.gitignore')) {
    logger.errorvp('.gitignore missing')
    logger.help2('? add it with [touch .gitignore]')
    process.exit(1)
  }

  // 2. check .env* files against .gitignore file
  let warningCount = 0
  const ig = ignore().add(fs.readFileSync('.gitignore').toString())
  const files = fs.readdirSync(process.cwd())
  const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
  dotenvFiles.forEach(file => {
    // check if that file is being ignored
    if (ig.ignores(file)) {
      switch (file) {
        case '.env.example':
          warningCount += 1
          logger.warnv(`${file} (currently ignored but should not be)`)
          logger.help2(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
          break
        case '.env.vault':
          warningCount += 1
          logger.warnv(`${file} (currently ignored but should not be)`)
          logger.help2(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
          break
        default:
          break
      }
    } else {
      switch (file) {
        case '.env.example':
          break
        case '.env.vault':
          break
        default:
          logger.errorvp(`${file} not properly gitignored`)
          logger.help2(`? add ${file} to .gitignore with [echo ".env*" >> .gitignore]`)
          process.exit(1) // 3.1 exit early with error code
          break
      }
    }
  })

  // 3. outpout success
  if (warningCount > 0) {
    logger.successvp(`success (with ${helpers.pluralize('warning', warningCount)})`)
  } else {
    logger.successvp('success')
  }
}

function installPrecommitHook () {
  const hookScript = `#!/bin/sh

if ! command -v dotenvx &> /dev/null
then
  echo "[dotenvx][precommit] 'dotenvx' command not found"
  echo "[dotenvx][precommit] ? install it with [brew install dotenvx/brew/dotenvx]"
  echo "[dotenvx][precommit] ? other install options [https://dotenvx.com/docs/install]"
  exit 1
fi

dotenvx precommit`
  const hookPath = path.join('.git', 'hooks', 'pre-commit')

  try {
    // Check if the pre-commit file already exists
    if (fs.existsSync(hookPath)) {
      // Read the existing content of the file
      const existingContent = fs.readFileSync(hookPath, 'utf8')

      // Check if 'dotenvx precommit' already exists in the file
      if (!existingContent.includes('dotenvx precommit')) {
        // Append 'dotenvx precommit' to the existing file
        fs.appendFileSync(hookPath, '\n' + hookScript)
        logger.successvp(`dotenvx precommit appended [${hookPath}]`)
      } else {
        logger.warnvp(`dotenvx precommit exists [${hookPath}]`)
      }
    } else {
      // If the pre-commit file doesn't exist, create a new one with the hookScript
      fs.writeFileSync(hookPath, hookScript)
      fs.chmodSync(hookPath, '755') // Make the file executable
      logger.successvp(`dotenvx precommit installed [${hookPath}]`)
    }
  } catch (err) {
    logger.errorvp(`Failed to modify pre-commit hook: ${err.message}`)
  }
}

module.exports = precommit
