const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')

module.exports = async function checkInit () {
  const fs = require('node:fs')
  const prompts = require('../../lib/helpers/prompts')
  const initDotenvxfile = require('../../lib/services/init')
  const scanSource = require('../../lib/dotenvxfile/discovery/scanSource')
  const discoverEnvFiles = require('../../lib/dotenvxfile/discovery/discoverEnvFiles')
  const options = this.opts()
  const requested = (this.envs || []).filter(env => env.type === 'envFile').map(env => env.value)
  const explicitFiles = requested.length ? requested : (Array.isArray(options.envFile) ? options.envFile : options.envFile ? [options.envFile] : [])
  const envFile = explicitFiles.length === 1 ? explicitFiles[0] : undefined
  const overwrite = options.overwrite === true
  const stdout = options.stdout === true
  const interactive = !process.env.CI && process.stdin.isTTY && process.stderr.isTTY
  let spinner

  try {
    const existing = !stdout && fs.existsSync('Dotenvxfile')
    if (existing && !overwrite) {
      logger.info('○ Dotenvxfile already exists [edit or run: dotenvx check --init --overwrite]')
      return
    }

    let envFiles = explicitFiles.length > 1 ? explicitFiles : undefined
    let sourceKeys = []
    let scanCode = false
    const onFile = filename => {
      if (spinner) spinner.text = `scanning ${filename}`
    }
    if (interactive && explicitFiles.length === 0) {
      const candidates = discoverEnvFiles()
      const selected = await prompts.multiselect({
        message: existing ? 'Recreate Dotenvxfile from .env files and code' : 'Create Dotenvxfile from .env files and code',
        submitLabel: existing ? 'Recreate Dotenvxfile' : 'Create Dotenvxfile',
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

    const { created, replaced, content } = initDotenvxfile({ envFile, envFiles, sourceKeys, overwrite, stdout, onFile })
    if (spinner) spinner.stop()
    if (stdout) {
      process.stdout.write(content)
      return
    }
    if (created) {
      logger.success(replaced ? '◈ recreated (Dotenvxfile)' : '◈ created (Dotenvxfile)')
      logger.help('⮕ next run [dotenvx check]')
    } else logger.info('○ Dotenvxfile already exists [edit or run: dotenvx check --init --overwrite]')
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
