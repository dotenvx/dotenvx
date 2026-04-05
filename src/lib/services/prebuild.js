/* istanbul ignore file */
const fsx = require('./../helpers/fsx')
const path = require('path')
const ignore = require('ignore')

const Ls = require('../services/ls')
const Errors = require('../helpers/errors')

const isFullyEncrypted = require('./../helpers/isFullyEncrypted')
const MISSING_DOCKERIGNORE = '.env.keys' // by default only ignore .env.keys. all other .env* files COULD be included - as long as they are encrypted

class Prebuild {
  constructor (directory = './') {
    // args
    this.directory = directory

    this.excludeEnvFile = ['test/**', 'tests/**', 'spec/**', 'specs/**', 'pytest/**', 'test_suite/**']
  }

  run () {
    let count = 0
    const warnings = []
    let dockerignore = MISSING_DOCKERIGNORE

    // 1. check for .dockerignore file
    if (!fsx.existsSync('.dockerignore')) {
      const warning = new Errors({
        message: '.dockerignore missing',
        help: 'fix: [touch .dockerignore]'
      }).custom()
      warnings.push(warning)
    } else {
      dockerignore = fsx.readFileXSync('.dockerignore')
    }

    // 2. check .env* files against .dockerignore file
    const ig = ignore().add(dockerignore)
    const lsService = new Ls(this.directory, undefined, this.excludeEnvFile)
    const dotenvFiles = lsService.run()
    dotenvFiles.forEach(_file => {
      count += 1

      const file = path.join(this.directory, _file) // to handle when directory argument passed

      // check if that file is being ignored
      if (ig.ignores(file)) {
        if (file === '.env.example' || file === '.env.x') {
          const warning = new Errors({
            message: `${file} ignored (should not be)`,
            help: `fix: [dotenvx ext gitignore --pattern !${file}]`
          }).custom()
          warnings.push(warning)
        }
      } else {
        if (file !== '.env.example' && file !== '.env.x') {
          const src = fsx.readFileXSync(file)
          const encrypted = isFullyEncrypted(src)

          // if contents are encrypted don't raise an error
          if (!encrypted) {
            let errorMsg = `${file} not encrypted/dockerignored`
            let errorHelp = `fix: [dotenvx encrypt -f ${file}] or [dotenvx ext gitignore --pattern ${file}]`
            if (file.includes('.env.keys')) {
              errorMsg = `${file} not dockerignored`
              errorHelp = `fix: [dotenvx ext gitignore --pattern ${file}]`
            }

            throw new Errors({ message: errorMsg, help: errorHelp }).custom()
          }
        }
      }
    })

    let successMessage = count === 0 ? '▣ no .env files' : `▣ encrypted/dockerignored (${count})`
    if (warnings.length > 0) {
      successMessage += ` with warnings (${warnings.length})`
    }

    return {
      successMessage,
      warnings
    }
  }
}

module.exports = Prebuild
