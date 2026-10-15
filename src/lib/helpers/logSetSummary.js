const { publickeys, injectsummary } = require('@dotenvx/primitives')
const keypair = require('../resolvers/keypair')
const { logger } = require('../../shared/logger')

async function logSetSummary (key, encrypt, result, options = {}) {
  const { processedEnvs, changedFilepaths, unchangedFilepaths } = result
  if (encrypt && !options.quiet) {
    for (const row of processedEnvs) {
      if (row.error || row.keySources || !publickeys(row.envSrc || '').length) continue
      try {
        const resolved = await keypair({ ...options, envFile: [row.filepath], includeProvider: true })
        row.keySources = { [publickeys(row.envSrc)[0]]: resolved.provider }
      } catch {} // Metadata lookup must not turn a successful write into a failure.
    }
  }

  const rows = new Map(processedEnvs.map(row => [row.envFilepath, {
    filepath: `(${row.envFilepath})`,
    publicKeys: publickeys(row.envSrc || ''),
    keySources: row.keySources
  }]))
  const paths = changedFilepaths.length ? changedFilepaths : unchangedFilepaths
  if (!paths.length) return
  const summary = encrypt ? injectsummary.sources(paths.map(filepath => rows.get(filepath) || `(${filepath})`)) : { files: [`(${paths.join(',')})`], suffix: '' }
  if (changedFilepaths.length) {
    logger.success(`${encrypt ? '◈ encrypted' : '◇ set'} ${key} ${summary.files.join(',')}${summary.suffix}`)
  } else {
    logger.info(`○ no change ${summary.files.join(',')}${summary.suffix}`)
  }
}

module.exports = logSetSummary
