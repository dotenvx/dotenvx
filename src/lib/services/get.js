const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

class Get {
  constructor (key, envFile = '.env', overload = false) {
    this.key = key
    this.envFile = envFile
    this.overload = overload
  }

  run () {
    const clonedEnv = { ...process.env }
    const options = {
      processEnv: clonedEnv,
      path: this.envFile,
      override: this.overload
    }
    const parsed = dotenv.config(options).parsed

    const expandedEnv = { ...clonedEnv }
    const expandOptions = {
      processEnv: expandedEnv,
      parsed: parsed
    }
    dotenvExpand.expand(expandOptions).parsed

    if (!this.key) {
      const result = {}

      for (const key of Object.keys(parsed)) {
        result[key] = expandedEnv[key]
      }

      return result
    }

    return expandedEnv[this.key]
  }
}

module.exports = Get
