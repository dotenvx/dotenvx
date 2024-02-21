const dotenv = require('dotenv')

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

    if (!this.key) {
      const result = {}

      for (const key of Object.keys(parsed)) {
        result[key] = clonedEnv[key]
      }

      return result
    }

    return clonedEnv[this.key]
  }
}

module.exports = Get
