/* istanbul ignore file */
const fsx = require('./../helpers/fsx')
const path = require('path')
const ignore = require('ignore')

const Ls = require('../services/ls')

const isFullyEncrypted = require('./../helpers/isFullyEncrypted')
const InstallPrecommitHook = require('./../helpers/installPrecommitHook')
const Errors = require('./../helpers/errors')
const childProcess = require('child_process')
const MISSING_GITIGNORE = '.env.keys' // by default only ignore .env.keys. all other .env* files COULD be included - as long as they are encrypted

class Precommit {
  constructor (directory = './', options = {}) {
    // args
    this.directory = directory
    // options
    this.install = options.install
    this.excludeEnvFile = ['test/**', 'tests/**', 'spec/**', 'specs/**', 'pytest/**', 'test_suite/**']
  }

  run () {
    if (this.install) {
      const {
        successMessage
      } = this._installPrecommitHook()

      return {
        successMessage,
        warnings: []
      }
    } else {
      let count = 0
      const warnings = []
      let gitignore = MISSING_GITIGNORE

      // 1. check for .gitignore file
      if (!fsx.existsSync('.gitignore')) {
        const warning = new Errors({
          message: '.gitignore missing',
          help: 'fix: [touch .gitignore]'
        }).custom()
        warnings.push(warning)
      } else {
        gitignore = fsx.readFileXSync('.gitignore')
      }

      // 2. check .env* files against .gitignore file
      const ig = ignore().add(gitignore)

      const lsService = new Ls(this.directory, undefined, this.excludeEnvFile)
      const dotenvFiles = lsService.run()
      dotenvFiles.forEach(_file => {
        count += 1

        const file = path.join(this.directory, _file) // to handle when directory argument passed

        // check if file is going to be committed
        if (this._isFileToBeCommitted(file)) {
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
                let errorMsg = `${file} not encrypted/gitignored`
                let errorHelp = `fix: [dotenvx encrypt -f ${file}] or [dotenvx ext gitignore --pattern ${file}]`
                if (file.includes('.env.keys')) {
                  errorMsg = `${file} not gitignored`
                  errorHelp = `fix: [dotenvx ext gitignore --pattern ${file}]`
                }

                throw new Errors({ message: errorMsg, help: errorHelp }).custom()
              }
            }
          }
        }
      })

      let successMessage = count === 0 ? '▣ no .env files' : `▣ encrypted/gitignored (${count})`
      if (warnings.length > 0) {
        successMessage += ` with warnings (${warnings.length})`
      }

      return {
        successMessage,
        warnings
      }
    }
  }

  _isInGitRepo () {
    try {
      childProcess.execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  _isFileToBeCommitted (filePath) {
    try {
      if (!this._isInGitRepo()) {
        // consider file to be committed if there is an error (not a git repo)
        return true
      }

      const output = childProcess.execSync('git diff HEAD --name-only').toString()
      const files = output.split('\n')
      return files.includes(filePath)
    } catch (error) {
      // consider file to be committed if there is an error (not using git)
      return true
    }
  }

  _installPrecommitHook () {
    return new InstallPrecommitHook().run()
  }
}

module.exports = Precommit
