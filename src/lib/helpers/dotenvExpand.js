function _resolveEscapeSequences (value) {
  return value.replace(/\\\$/g, '$')
}

function interpolate (value, env) {
  const regex = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g

  let result = value
  let match
  const seen = new Set() // self-referential checker

  while ((match = regex.exec(result)) !== null) {
    seen.add(result)

    const [template, bracedExpression, unbracedExpression] = match
    const expression = bracedExpression || unbracedExpression
    const r = expression.split(/:-|-/)
    const key = r.shift()
    const defaultValue = r.join('-')
    const value = env[key]

    if (value) {
      // self-referential check
      if (seen.has(value)) {
        result = result.replace(template, defaultValue)
      } else {
        result = result.replace(template, value)
      }
    } else {
      result = result.replace(template, defaultValue)
    }

    regex.lastIndex = 0 // reset regex search position to re-evaluate after each replacement
  }

  return result
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
