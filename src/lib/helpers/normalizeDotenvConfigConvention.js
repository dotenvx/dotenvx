function normalizeDotenvConfigConvention (
  /** @type {import('../main').DotenvConfigOptions} */ options
) {
  const convention = process.env.DOTENV_CONVENTION || process.env.DOTENV_CONFIG_CONVENTION

  if (!options.convention && convention) {
    options.convention = convention
  }

  return options
}

module.exports = normalizeDotenvConfigConvention
