const createSpinner = require('./createSpinner')

module.exports = async function createProtectSpinner (options = {}) {
  // Git pipes stdin/stdout; only stderr can tell us whether a user is watching.
  if (!process.stderr.isTTY || 'CI' in process.env || process.env.TERM === 'dumb') return null
  const spinner = await createSpinner({ ...options, text: 'dotenvx protecting...', frames: ['⛉'] })
  // Temporary, opt-in preview delay for checking the staging indicator.
  const delay = Number(process.env.DOTENVX_PROTECT_PREVIEW_MS)
  if (spinner && Number.isFinite(delay) && delay > 0) {
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)))
  }
  return spinner
}
