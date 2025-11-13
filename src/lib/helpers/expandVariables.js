function expandVariables (value, env, literals = {}) {
  const regex = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g

  let result = value
  let match

  while ((match = regex.exec(result)) !== null) {
    const [template, bracedExpression, unbracedExpression] = match
    const expression = bracedExpression || unbracedExpression

    // match the operators `:+`, `+`, `:-`, and `-`
    const opRegex = /(:\+|\+|:-|-)/
    // find first match
    const opMatch = expression.match(opRegex)
    const splitter = opMatch ? opMatch[0] : null

    const r = expression.split(splitter)

    let defaultValue
    let val
    const key = r.shift()

    if ([':+', '+'].includes(splitter)) {
      defaultValue = env[key] ? r.join(splitter) : ''
      val = null
    } else {
      defaultValue = r.join(splitter)
      val = env[key]
    }

    if (val) {
      result = result.replace(template, val)
    } else {
      result = result.replace(template, defaultValue)
    }

    // if the result equaled what was in env then stop expanding - handle self-referential check as well
    if (result === env[key]) {
      break
    }

    // if the result came from what was a literal value then stop expanding
    // BUT only if the literal value contains expansion patterns (${...} or $VAR)
    if (literals[key] && /\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/.test(literals[key])) {
      break
    }

    regex.lastIndex = 0 // reset regex search position to re-evaluate after each replacement
  }

  return result
}

module.exports = expandVariables
