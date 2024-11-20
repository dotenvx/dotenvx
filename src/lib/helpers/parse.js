const chomp = require('./chomp')
const truncate = require('./truncate')
const decryptValue = require('./decryptValue')
const resolveEscapeSequences = require('./resolveEscapeSequences')
const { execSync } = require('child_process')

class Parse {
  static LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

  constructor (src, privateKey = null, processEnv = process.env, overload = false) {
    this.src = src
    this.privateKey = privateKey
    this.processEnv = processEnv
    this.overload = overload

    this.parsed = {}
    this.preExisted = {}
    this.injected = {}
    this.warnings = []

    // for use with progressive expansion
    this.runningParsed = {}
  }

  run () {
    const lines = this.getLines()

    let match
    while ((match = Parse.LINE.exec(lines)) !== null) {
      const key = match[1]
      const value = match[2]
      const quote = this.quote(value) // must be raw match
      this.parsed[key] = this.clean(value, quote) // file value

      if (!this.overload && this.inProcessEnv(key)) {
        this.parsed[key] = this.processEnv[key] // use process.env pre-existing value
      }

      // decrypt
      try {
        this.parsed[key] = this.decrypt(this.parsed[key])
      } catch (e) {
        this.warnings.push(this.warning(e, key))
      }

      // eval empty, double, or backticks
      let evaled = false
      if (quote !== "'" && (!this.inProcessEnv(key) || this.processEnv[key] === this.parsed[key])) {
        const priorEvaled = this.parsed[key]
        this.parsed[key] = this.eval(priorEvaled)
        if (priorEvaled !== this.parsed[key]) {
          evaled = true
        }
      }

      // expand empty, double, or backticks
      if (!evaled && quote !== "'" && !this.processEnv[key]) {
        this.parsed[key] = resolveEscapeSequences(this.expand(this.parsed[key]))
      }

      // for use with progressive expansion
      this.runningParsed[key] = this.parsed[key]

      if (Object.prototype.hasOwnProperty.call(this.processEnv, key) && !this.overload) {
        this.preExisted[key] = this.processEnv[key] // track preExisted
      } else {
        this.injected[key] = this.parsed[key] // track injected
      }
    }

    return {
      parsed: this.parsed,
      processEnv: this.processEnv,
      injected: this.injected,
      warnings: this.warnings,
      preExisted: this.preExisted
    }
  }

  trimmer (value) {
    // Default undefined or null to empty string
    return (value || '').trim()
  }

  quote (value) {
    const v = this.trimmer(value)
    const maybeQuote = v[0]
    let q = ''
    switch (maybeQuote) {
      // single
      case "'":
        q = "'"
        break
      // double
      case '"':
        q = '"'
        break
      // backtick
      case '`':
        q = '`'
        break
      // empty
      default:
        q = ''
    }

    return q
  }

  clean (value, _quote) {
    let v = this.trimmer(value)

    // Remove surrounding quotes
    v = v.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (_quote === '"') {
      v = v.replace(/\\n/g, '\n')
      v = v.replace(/\\r/g, '\r')
    }

    return v
  }

  decrypt (value) {
    return decryptValue(value, this.privateKey)
  }

  eval (value) {
    // Match everything between the outermost $() using a regex with non-capturing groups
    const matches = value.match(/\$\(([^)]+(?:\)[^(]*)*)\)/g) || []

    return matches.reduce(function (newValue, match) {
      const command = match.slice(2, -1) // Extract command by removing $() wrapper
      const result = chomp(execSync(command).toString()) // execute command
      return newValue.replace(match, result) // Replace match with result
    }, value)
  }

  expand (value) {
    let env = { ...this.runningParsed, ...this.processEnv } // typically process.env wins
    if (this.overload) {
      env = { ...this.processEnv, ...this.runningParsed } // parsed wins
    }

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
      let value

      const key = r.shift()

      if ([':+', '+'].includes(splitter)) {
        defaultValue = env[key] ? r.join(splitter) : ''
        value = null
      } else {
        defaultValue = r.join(splitter)
        value = env[key]
      }

      if (value) {
        result = result.replace(template, value)
      } else {
        result = result.replace(template, defaultValue)
      }

      // if the result equaled what was in env then stop expanding - handle self-referential check as well
      if (result === env[key]) {
        break
      }

      regex.lastIndex = 0 // reset regex search position to re-evaluate after each replacement
    }

    return result
  }

  inProcessEnv (key) {
    return Object.prototype.hasOwnProperty.call(this.processEnv, key)
  }

  getLines () {
    return (this.src || '').toString().replace(/\r\n?/mg, '\n') // Convert buffer to string and Convert line breaks to same format
  }

  warning (e, key) {
    const warning = new Error(`[${e.code}] could not decrypt ${key} using private key '${truncate(this.privateKey)}'`)
    warning.code = e.code
    warning.help = `[${e.code}] ? ${e.message}`

    return warning
  }
}

module.exports = Parse
