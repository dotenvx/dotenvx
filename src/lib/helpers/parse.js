const chomp = require('./chomp')
const truncate = require('./truncate')
const decryptValue = require('./decryptValue')
const resolveEscapeSequences = require('./resolveEscapeSequences')
const { execSync } = require('child_process')

class Parse {
  static LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

  constructor (src, privateKey = null, processEnv = process.env) {
    this.src = src
    this.privateKey = privateKey
    this.processEnv = processEnv

    //
    this.parsed = {}
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

      // handle existing value - process.env wins
      this.parsed[key] = this.processEnv[key] || this.parsed[key]

      // decrypt
      try {
        this.parsed[key] = this.decrypt(this.parsed[key])
      } catch (e) {
        this.warnings.push(this.warning(e, key))
      }

      // eval empty, double, or backticks
      if (quote !== "'" && (!this.inProcessEnv(key) || this.processEnv[key] === this.parsed[key])) {
        this.parsed[key] = this.eval(this.parsed[key])
      }

      // expand empty, double, or backticks
      if (quote !== "'") {
        this.parsed[key] = resolveEscapeSequences(this.expand(this.parsed[key]))
      }

      // for use with progressive expansion
      this.runningParsed[key] = this.parsed[key]
    }

    return {
      parsed: this.parsed
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
    const matches = value.match(/\$\([^()]+\)/) || []

    return matches.reduce(function (newValue, match) {
      // get command
      const command = match.substring(2, match.length - 1)
      // execute command
      const value = chomp(execSync(command).toString())
      // replace with command value
      return newValue.replace(match, value)
    }, value)
  }

  expand (value) {
    const env = { ...this.runningParsed, ...this.processEnv } // current parsed and current process.env with process.env winning as default
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

  inProcessEnv (key) {
    return Object.prototype.hasOwnProperty.call(this.processEnv, key)
  }

  getLines () {
    return this.src.toString().replace(/\r\n?/mg, '\n') // Convert buffer to string and Convert line breaks to same format
  }

  warning (e, key) {
    const warning = new Error(`[${e.code}] could not decrypt ${key} using private key '${truncate(this.privateKey)}'`)
    warning.code = e.code
    warning.help = `[${e.code}] ? ${e.message}`

    return warning
  }
}

module.exports = Parse
