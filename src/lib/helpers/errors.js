class Errors {
  constructor (options = {}) {
    this.filepath = options.filepath
    this.envFilepath = options.envFilepath

    this.key = options.key
  }

  missingEnvFile () {
    const code = 'MISSING_ENV_FILE'
    const message = `[${code}] missing ${this.envFilepath} file (${this.filepath})`
    const help = `[${code}] ? add one with [echo "HELLO=World" > ${this.envFilepath}]`

    const e = new Error(message)
    e.code = code
    e.help = help
    return e
  }

  missingKey () {
    const code = 'MISSING_KEY'
    const message = `[${code}] missing ${this.key} key`

    const e = new Error(message)
    e.code = code
    return e
  }
}

module.exports = Errors
