const { publickeys, injectsummary } = require('@dotenvx/primitives')

module.exports = function summarizeKeys (filepaths, rows) {
  return injectsummary.sources(filepaths.map(filepath => {
    const row = rows.find(row => (row.envFilepath || row.filepath) === filepath)
    return {
      filepath,
      publicKeys: row ? publickeys(row.envSrc || row.src || '') : [],
      keySources: row && row.keySources
    }
  }))
}
