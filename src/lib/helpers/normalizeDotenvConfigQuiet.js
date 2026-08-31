function normalizeDotenvConfigQuiet (
  /** @type {import('../main').DotenvConfigOptions} */ options
) {
  const quiet = process.env.DOTENV_QUIET ?? process.env.DOTENV_CONFIG_QUIET

  if (quiet === 'true') {
    options.quiet = true
  }

  return options
}

module.exports = normalizeDotenvConfigQuiet
