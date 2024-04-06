const Run = require('./run')

class Get {
  constructor (key, envs = [], overload = false, DOTENV_KEY = '', all = false) {
    this.key = key
    this.envs = envs
    this.overload = overload
    this.DOTENV_KEY = DOTENV_KEY
    this.all = all
  }

  run () {
    const processEnv = { ...process.env }
    const { processedEnvs } = new Run(this.envs, this.overload, this.DOTENV_KEY, processEnv).run()

    if (!this.key) {
      // if user wants to return ALL envs (even prior set on machine)
      if (this.all) {
        return processEnv
      }

      // typical scenario - return only envs that were identified in the .env file
      // iterate over all processedEnvs.parsed and grab from processEnv
      const result = {}
      for (const processedEnv of processedEnvs) {
        // parsed means we saw the key in a file or --env flag. this effectively filters out any preset machine envs - while still respecting complex evaluating, expansion, and overload. in other words, the value might be the machine value because the key was displayed in a .env file
        if (processedEnv.parsed) {
          for (const key of Object.keys(processedEnv.parsed)) {
            result[key] = processEnv[key]
          }
        }
      }

      return result
    }

    return processEnv[this.key]
  }
}

module.exports = Get
