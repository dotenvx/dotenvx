const { logger } = require('../../shared/logger')

module.exports = function logProtectedFiles (files) {
  const names = [...new Set(files)]
  if (!names.length) return
  const display = names.slice(0, 3).map(name => /^[\w./-]+$/.test(name) ? name : JSON.stringify(name))
  if (names.length > 3) display.push(`+${names.length - 3} more`)
  logger.success(`⛉ safe to commit (${display.join(', ')})`)
}
