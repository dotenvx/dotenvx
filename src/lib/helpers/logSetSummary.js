const { publickeys, injectsummary } = require('@dotenvx/primitives')
const { logger } = require('../../shared/logger')

function logSetSummary (key, encrypt, result) {
  const { processedEnvs, changedFilepaths, unchangedFilepaths } = result
  const rows = new Map(processedEnvs.map(row => [row.envFilepath, {
    filepath: `(${row.envFilepath})`,
    publicKeys: publickeys(row.envSrc || ''),
    keySources: row.keySources
  }]))
  const paths = changedFilepaths.length ? changedFilepaths : unchangedFilepaths
  if (!paths.length) return
  const summary = encrypt ? injectsummary.sources(paths.map(filepath => rows.get(filepath) || `(${filepath})`)) : { files: [`(${paths.join(',')})`], suffix: '' }
  if (changedFilepaths.length) {
    logger.success(`${encrypt ? '◈ encrypted' : '◇ set'} ${key} ${summary.files.join('; ')}${summary.suffix}`)
  } else {
    logger.info(`○ no change ${summary.files.join('; ')}${summary.suffix}`)
  }
}

module.exports = logSetSummary
