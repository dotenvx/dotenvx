const Run = require('./run')

const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

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

    new Run(this.envs, this.overload, this.DOTENV_KEY, processEnv).run()

    if (!this.key) {
      // // if user wants to return ALL envs (even prior set on machine)
      // if (this.all) {
      //   return expandedEnv
      // }

      // // typical scenario - return only envs that were identified in the .env file
      // const result = {}
      // for (const key of Object.keys(parsed)) {
      //   result[key] = expandedEnv[key]
      // }

      return processEnv
      // return result
    }

    return processEnv[this.key]
  }

  // constructor (key, envFile = '.env', overload = false, all = false) {
  //   this.key = key
  //   this.envFile = envFile
  //   this.overload = overload
  //   this.all = all
  // }

  // runOld () {
  //   const clonedEnv = { ...process.env }
  //   const options = {
  //     processEnv: clonedEnv,
  //     path: this.envFile,
  //     override: this.overload
  //   }
  //   const parsed = dotenv.config(options).parsed

  //   const expandedEnv = { ...clonedEnv }
  //   const expandOptions = {
  //     processEnv: expandedEnv,
  //     parsed
  //   }
  //   dotenvExpand.expand(expandOptions)

  //   if (!this.key) {
  //     // if user wants to return ALL envs (even prior set on machine)
  //     if (this.all) {
  //       return expandedEnv
  //     }

  //     // typical scenario - return only envs that were identified in the .env file
  //     const result = {}
  //     for (const key of Object.keys(parsed)) {
  //       result[key] = expandedEnv[key]
  //     }

  //     return result
  //   }

  //   return expandedEnv[this.key]
  // }
}

module.exports = Get
