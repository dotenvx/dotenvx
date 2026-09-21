const installProtectFilter = require('../../lib/helpers/installProtectFilter')
const installProtectIgnore = require('../../lib/helpers/installProtectIgnore')
const prompts = require('../../lib/helpers/prompts')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const settings = require('../../lib/helpers/protectSettings')
const createSpinner = require('../../lib/helpers/createSpinner')

module.exports = async function protect (directory) {
  if (this.opts().docker) return require('./protectDocker').call(this, directory)
  const filterOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : this.opts()
  if (this.opts().gitProcess) return require('./protectProcess')(filterOptions)
  if (this.opts().gitFile !== undefined) {
    return require('./protectStdin')(this.opts().gitFile, filterOptions)
  }
  let spinner
  try {
    let filter = true
    let ignore = false
    let current
    const interactive = !process.env.CI && process.stdin.isTTY && process.stderr.isTTY
    if (interactive) {
      current = settings.state()
      const protections = await prompts.multiselect({
        message: 'Set protections',
        submitLabel: selected => {
          if (current.configured && ['filter', 'ignore'].every(key => selected.includes(key) === current[key])) return 'Done'
          if (!selected.length) return 'Remove protections'
          return current.configured ? 'Apply changes' : 'Install protections'
        },
        choices: [
          { name: 'Protect plaintext secrets from code commits (.env*)', value: 'filter' },
          { name: 'Protect private keys from code commits (.env.keys*)', value: 'ignore' }
        ],
        initial: ['filter', 'ignore']
      })
      filter = protections.includes('filter')
      ignore = protections.includes('ignore')
    }
    const options = this.opts()
    const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
    spinner = await createSpinner({ ...spinnerOptions, ...options, text: filter || ignore ? 'protecting' : 'unprotecting' })
    if (interactive) {
      // Check ownership-sensitive removal before changing the filter.
      if (!ignore && current.ignore) settings.removeIgnore()
      if (!filter && current.filter) settings.removeFilter()
    }
    const protectedFiles = []
    let hookWarning
    if (filter) {
      installProtectFilter()
      require('../../lib/helpers/removeLegacyProtectFilter')()
      const { warning } = require('../../lib/helpers/uninstallPrecommitHook')()
      hookWarning = warning
      protectedFiles.push('.env*')
    }
    if (ignore) {
      if (!current || !current.ignore) installProtectIgnore()
      protectedFiles.push('.env.keys*')
    }
    if (interactive) settings.markConfigured()
    if (spinner) spinner.stop()
    if (hookWarning) logger.warn(hookWarning)
    const status = protectedFiles.length === 2 ? 'full' : 'partial'
    if (protectedFiles.length) logger.success(`⛉ protection: ${status} (${protectedFiles.join(', ')})`)
    else logger.success('⛉ protection: none')
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exitCode = 1
  }
}
