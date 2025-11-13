const decryptKeyValue = require('./decryptKeyValue')
const evalKeyValue = require('./evalKeyValue')
const expandVariables = require('./expandVariables')
const resolveEscapeSequences = require('./resolveEscapeSequences')

class Parse {
  static LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

  constructor (src, privateKey = null, processEnv = process.env, overload = false, privateKeyName = null) {
    this.src = src
    this.privateKey = privateKey
    this.privateKeyName = privateKeyName
    this.processEnv = processEnv
    this.overload = overload

    this.parsed = {}
    this.preExisted = {}
    this.injected = {}
    this.errors = []

    // for use with progressive expansion
    this.runningParsed = {}
    // for use with stopping expansion for literals
    this.literals = {}
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
        this.parsed[key] = this.decrypt(key, this.parsed[key])
      } catch (e) {
        this.errors.push(e)
      }

      // eval empty, double, or backticks
      let evaled = false
      if (quote !== "'" && (!this.inProcessEnv(key) || this.processEnv[key] === this.parsed[key])) {
        const priorEvaled = this.parsed[key]
        // eval
        try {
          this.parsed[key] = this.eval(key, priorEvaled)
        } catch (e) {
          this.errors.push(e)
        }
        if (priorEvaled !== this.parsed[key]) {
          evaled = true
        }
      }

      // expand empty, double, or backticks
      if (!evaled && quote !== "'" && (!this.processEnv[key] || this.overload)) {
        this.parsed[key] = resolveEscapeSequences(this.expand(this.parsed[key]))
      }

      if (quote === "'") {
        this.literals[key] = this.parsed[key]
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
      preExisted: this.preExisted,
      errors: this.errors
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
      v = v.replace(/\\n/g, '\n') // newline
      v = v.replace(/\\r/g, '\r') // carriage return
      v = v.replace(/\\t/g, '\t') // tabs
    }

    return v
  }

  decrypt (key, value) {
    return decryptKeyValue(key, value, this.privateKeyName, this.privateKey)
  }

  eval (key, value) {
    return evalKeyValue(key, value, this.processEnv, this.runningParsed)
  }

  expand (value) {
    let env = { ...this.runningParsed, ...this.processEnv } // typically process.env wins
    if (this.overload) {
      env = { ...this.processEnv, ...this.runningParsed } // parsed wins
    }

    return expandVariables(value, env, this.literals)
  }

  inProcessEnv (key) {
    return Object.prototype.hasOwnProperty.call(this.processEnv, key)
  }

  getLines () {
    return (this.src || '').toString().replace(/\r\n?/mg, '\n') // Convert buffer to string and Convert line breaks to same format
  }
}

module.exports = Parse
