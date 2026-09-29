const fs = require('node:fs')
const process = require('node:process')
const prompts = require('../../lib/helpers/prompts')
const initEnvspec = require('../../lib/services/init')
const scanSource = require('../../lib/envspec/discovery/scanSource')
const discoverEnvFiles = require('../../lib/envspec/discovery/discoverEnvFiles')
const createSpinner = require('../../lib/helpers/createSpinner')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = async function spec () {
  const options = this.opts()
  const envFile = options.envFile
  const overwrite = options.overwrite === true
  const stdout = options.stdout === true
  const interactive = !process.env.CI && process.stdin.isTTY && process.stderr.isTTY
  let spinner

  try {
    const existing = stdout ? undefined : fs.lstatSync('Envspec', { throwIfNoEntry: false })
    if (existing && !overwrite) {
      logger.info('○ Envspec already exists [edit or run: spec --overwrite]')
      return
    }
    if (existing && !existing.isFile()) throw new Error('Cannot replace Envspec: expected a regular file')

    let envFiles
    let sourceKeys = []
    let scanCode = false
    const onFile = filename => {
      if (spinner) spinner.text = `scanning ${filename}`
    }
    if (interactive && !envFile) {
      const candidates = discoverEnvFiles()
      const selected = await prompts.multiselect({
        message: existing ? 'Recreate Envspec from .env files and code' : 'Create Envspec from .env files and code',
        submitLabel: existing ? 'Recreate Envspec' : 'Create Envspec',
        choices: [...candidates, { name: 'code ./**/* (env references)', value: '__scan_source' }],
        initial: [...candidates, '__scan_source']
      })
      envFiles = selected.filter(value => value !== '__scan_source')
      scanCode = selected.includes('__scan_source')
    }

    const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
    spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'scanning' })
    if (scanCode) {
      const { keys } = await scanSource({ onFile })
      sourceKeys = keys
    }

    const { created, replaced, content } = initEnvspec({ envFile, envFiles, sourceKeys, overwrite, stdout, onFile })
    if (spinner) spinner.stop()
    if (stdout) {
      process.stdout.write(content)
      return
    }
    if (created) {
      logger.success(replaced ? '◈ recreated (Envspec)' : '◈ created (Envspec)')
      logger.help('⮕ next run [dotenvx check]')
    } else logger.info('○ Envspec already exists [edit or run: spec --overwrite]')
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
