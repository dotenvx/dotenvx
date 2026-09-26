const fs = require('node:fs')
const process = require('node:process')
const prompts = require('../../lib/helpers/prompts')
const initEnvfile = require('../../lib/services/init')
const scanSource = require('../../lib/helpers/scanSource')
const createSpinner = require('../../lib/helpers/createSpinner')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = async function init () {
  const envFile = this.opts().envFile
  const interactive = !process.env.CI && process.stdin.isTTY && process.stderr.isTTY
  let spinner

  try {
    if (fs.lstatSync('Envfile', { throwIfNoEntry: false })) {
      logger.info('○ Envfile already exists (unchanged)')
      return
    }

    let envFiles
    let sourceKeys = []
    let scanCode = false
    const onFile = filename => {
      if (spinner) spinner.text = `scanning ${filename}`
    }
    if (interactive && !envFile) {
      const candidates = fs.readdirSync('.', { withFileTypes: true })
        .filter(entry => (entry.name === '.env' || entry.name.startsWith('.env.')) &&
          !/^\.env\.(schema|x)$/.test(entry.name) &&
          !/^\.env\.(keys|vault)(\.|$)/.test(entry.name) &&
          (entry.isFile() || (entry.isSymbolicLink() && fs.statSync(entry.name, { throwIfNoEntry: false })?.isFile())))
        .map(entry => entry.name)
        .sort()
      const selected = await prompts.multiselect({
        message: 'Create Envfile from your .env files and source code:',
        submitLabel: 'Create Envfile',
        choices: [...candidates, { name: 'code ./**/* (env references)', value: '__scan_source' }],
        initial: [...candidates, '__scan_source']
      })
      envFiles = selected.filter(value => value !== '__scan_source')
      scanCode = selected.includes('__scan_source')
    }

    const options = this.opts()
    const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
    spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'scanning' })
    if (scanCode) {
      const { keys } = await scanSource({ onFile })
      sourceKeys = keys
    }

    const { created } = initEnvfile({ envFile, envFiles, sourceKeys, onFile })
    if (spinner) spinner.stop()
    if (created) logger.success('◈ created (Envfile)')
    else logger.info('○ Envfile already exists (unchanged)')
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
