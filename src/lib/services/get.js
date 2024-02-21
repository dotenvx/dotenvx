const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

class Get {
  constructor (key, envFile = '.env', overload = false, all = false) {
    this.key = key
    this.envFile = envFile
    this.overload = overload
    this.all = all
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
      parsed
    }
    dotenvExpand.expand(expandOptions)

    if (!this.key) {
      // if user wants to return ALL envs (even prior set on machine)
      if (this.all) {
        return expandedEnv
      }

      // typical scenario - return only envs that were identified in the .env file
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
