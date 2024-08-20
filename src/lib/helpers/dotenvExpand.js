// * /
// *   (\\)?            # is it escaped with a backslash?
// *   (\$)             # literal $
// *   (?!\()           # shouldnt be followed by parenthesis
// *   (\{?)            # first brace wrap opening
// *   ([\w.]+)         # key
// *   (?::-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))? # optional default nested 3 times
// *   (\}?)            # last brace warp closing
// * /xi

const DOTENV_SUBSTITUTION_REGEX = /(\\)?(\$)(?!\()(\{?)([\w.]+)(?::?-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))?(\}?)/gi

function _resolveEscapeSequences (value) {
  return value.replace(/\\\$/g, '$')
}

function interpolate (value, lookups) {
  return value.replace(DOTENV_SUBSTITUTION_REGEX, (match, escaped, dollarSign, openBrace, key, defaultValue, closeBrace) => {
    if (escaped === '\\') {
      return match.slice(1)
    } else {
      if (lookups[key]) {
        // avoid recursion from EXPAND_SELF=$EXPAND_SELF
        if (lookups[key] === value) {
          return lookups[key]
        } else {
          return interpolate(lookups[key], lookups)
        }
      }

      if (defaultValue) {
        if (defaultValue.startsWith('$')) {
          return interpolate(defaultValue, lookups)
        } else {
          return defaultValue
        }
      }

      return ''
    }
  })
}

function expand (options) {
  const processEnv = options.processEnv || {}
  const parsed = options.parsed || {}

  const combined = { ...processEnv, ...parsed }
  const combinedReversed = { ...parsed, ...processEnv }

  for (const key in parsed) {
    const value = parsed[key]

    // interpolate using both file and processEnv (file interpolation wins. used for --overload later)
    const fileValue = _resolveEscapeSequences(interpolate(value, combined))
    parsed[key] = fileValue

    if (fileValue === _resolveEscapeSequences(value)) {
      continue // no change means no expansion, move on
    }

    if (processEnv[key]) {
      continue // already has a value in processEnv, move on
    }

    const processEnvValue = interpolate(value, combinedReversed) // could be empty string ''
    if (processEnvValue) {
      processEnv[key] = _resolveEscapeSequences(processEnvValue) // set it
    }
  }

  return {
    parsed,
    processEnv
  }
}

module.exports.expand = expand
