const { objectTreeify: treeify } = require('@dotenvx/tooling')
const path = require('path')

const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')
const ArrayToTree = require('./../../lib/helpers/arrayToTree')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')

async function ls (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  let spinnerOptions
  if (typeof this.optsWithGlobals === 'function') {
    spinnerOptions = this.optsWithGlobals()
  } else {
    spinnerOptions = options
  }
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'traversing' })
  const startedAt = Date.now()
  let directoryCount = 1
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const filepaths = await main.ls(directory, options.envFile, options.excludeEnvFile, (filepath) => {
      directoryCount += 1

      if (spinner) {
        const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
        let directoryLabel = 'directories'
        if (directoryCount === 1) {
          directoryLabel = 'directory'
        }

        spinner.text = `traversing ${directoryCount.toLocaleString()} ${directoryLabel} (${elapsedSeconds}s) — ${filepath}`
      }
    })
    logger.debug(`filepaths: ${JSON.stringify(filepaths)}`)

    if (spinner) spinner.stop()

    if (options.json) {
      const cwd = path.resolve(directory || '.')
      const absoluteFilepaths = filepaths.map(filepath => path.resolve(cwd, filepath))
      console.log(JSON.stringify(absoluteFilepaths, null, 2))
    } else {
      const tree = new ArrayToTree(filepaths).run()
      logger.debug(`tree: ${JSON.stringify(tree)}`)
      logger.info(treeify(tree))
    }

    if (!spinnerOptions.quiet && !options.quiet) {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      const matchedDirectoryCount = new Set(filepaths.map(filepath => path.dirname(filepath))).size
      let fileLabel = 'files'
      if (filepaths.length === 1) {
        fileLabel = 'file'
      }
      let directoryLabel = 'directories'
      if (matchedDirectoryCount === 1) {
        directoryLabel = 'directory'
      }

      console.error(`▣ found ${filepaths.length.toLocaleString()} .env ${fileLabel} across ${matchedDirectoryCount.toLocaleString()} ${directoryLabel} of ${directoryCount.toLocaleString()} scanned in ${elapsedSeconds}s`)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = ls
