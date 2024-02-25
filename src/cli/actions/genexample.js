const fs = require('fs')
const helpers = require('./../helpers')
const logger = require('./../../shared/logger')
const createSpinner = require('./../../shared/createSpinner')

const dotenv = require('dotenv')
const spinner = createSpinner('generating')

const ENCODING = 'utf8'

async function genexample () {
  spinner.start()
  await helpers.sleep(500) // better dx

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  let optionEnvFile = options.envFile
  if (!Array.isArray(optionEnvFile)) {
    optionEnvFile = [optionEnvFile]
  }

  // must be at least one .env* file
  if (optionEnvFile.length < 1) {
    spinner.fail('no .env* files found')
    logger.help('? add one with [echo "HELLO=World" > .env] and then run [dotenvx genexample]')
    process.exit(1)
  }

  const keys = new Set()
  const addedKeys = new Set()

  for (const envFilepath of optionEnvFile) {
    const filepath = helpers.resolvePath(envFilepath)

    logger.verbose(`loading env from ${filepath}`)

    try {
      const src = fs.readFileSync(filepath, { encoding: ENCODING })
      const parsed = dotenv.parse(src)
      Object.keys(parsed).forEach(key => { keys.add(key) })
    } catch (e) {
      // calculate development help message depending on state of repo
      const vaultFilepath = helpers.resolvePath('.env.vault')
      let developmentHelp = '? in development: add one with [echo "HELLO=World" > .env] and re-run [dotenvx genexample]'
      if (fs.existsSync(vaultFilepath)) {
        developmentHelp = '? in development: use [dotenvx decrypt] to decrypt .env.vault to .env and then re-run [dotenvx genexample]'
      }

      switch (e.code) {
        // missing .env
        case 'ENOENT':
          logger.warn(`missing ${envFilepath} file (${filepath})`)
          logger.help(developmentHelp)
          break

        // unhandled error
        default:
          logger.warn(e)
          break
      }
    }
  }

  const exampleFilename = '.env.example'
  const exampleFilepath = helpers.resolvePath(exampleFilename)
  if (!fs.existsSync(exampleFilepath)) {
    logger.verbose(`creating ${exampleFilename}`)
    fs.writeFileSync(exampleFilename, `# ${exampleFilename}\n`)
  }

  const currentEnvExample = (configDotenv({ path: exampleFilepath }).parsed || {})
  const keysArray = Array.from(keys)

  keysArray.forEach(key => {
    if (key in currentEnvExample) {
      logger.verbose(`pre-existing ${key} in ${exampleFilename}`)
    } else {
      addedKeys.add(key)
      logger.verbose(`appending ${key} to ${exampleFilename}`)
      fs.appendFileSync('.env.example', `${key}=""\n`, ENCODING)
    }
  })

  if (addedKeys.size > 0) {
    spinner.succeed(`updated ${exampleFilename} (${addedKeys.size})`)
  } else {
    spinner.done(`no changes (${exampleFilename})`)
  }
}

module.exports = genexample
