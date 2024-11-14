const quotesHelper = require('./quotes')

class Parse {
  static LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

  constructor (src, privateKey = null, processEnv = process.env) {
    this.src = src
    this.privateKey = privateKey
    this.processEnv = processEnv

    //
    this.parsed = {}
    this.warnings = []
  }

  run () {
    const lines = this.getLines()
    const quotes = this.getQuotes()

    let match
    while ((match = Parse.LINE.exec(lines)) !== null) {
      const key = match[1]
      const value = match[2]
      this.parsed[key] = this.cleanValue(value)
    }

    return {
      parsed: this.parsed
    }
  }

  cleanValue (value) {
    // Default undefined or null to empty string
    let v = (value || '')

    // Remove whitespace
    v = v.trim()

    // Check if double quoted
    const maybeQuote = v[0]

    // Remove surrounding quotes
    v = v.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      v = v.replace(/\\n/g, '\n')
      v = v.replace(/\\r/g, '\r')
    }

    return v
  }

  getQuotes () {
    return quotesHelper(this.src)
  }

  getLines () {
    return this.src.toString().replace(/\r\n?/mg, '\n') // Convert buffer to string and Convert line breaks to same format
  }
}

module.exports = Parse
