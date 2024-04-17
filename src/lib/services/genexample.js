const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const ENCODING = 'utf8'

const findEnvFiles = require('../helpers/findEnvFiles')

class Genexample {
  constructor (directory = '.', envFile) {
    this.directory = directory
    this.envFile = envFile || findEnvFiles(directory)
  }

  run () {
    if (this.envFile.length < 1) {
      const code = 'MISSING_ENV_FILES'
      const message = 'no .env* files found'
      const help = '? add one with [echo "HELLO=World" > .env] and then run [dotenvx genexample]'

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    const keys = new Set()
    const addedKeys = new Set()
    const envFilepaths = this._envFilepaths()

    for (const envFilepath of envFilepaths) {
      const filepath = path.resolve(this.directory, envFilepath)
      if (!fs.existsSync(filepath)) {
        const code = 'MISSING_ENV_FILE'
        const message = `file does not exist at [${filepath}]`
        const help = `? add it with [echo "HELLO=World" > ${envFilepath}] and then run [dotenvx genexample]`

        const error = new Error(message)
        error.code = code
        error.help = help
        throw error
      }

      const parsed = dotenv.configDotenv({ path: filepath }).parsed
      for (const key of Object.keys(parsed)) {
        keys.add(key)
      }
    }

    let envExampleFile = ''
    const exampleFilename = '.env.example'
    const exampleFilepath = path.resolve(this.directory, exampleFilename)
    if (!fs.existsSync(exampleFilepath)) {
      envExampleFile += `# ${exampleFilename} - generated with dotenvx\n`
    } else {
      envExampleFile = fs.readFileSync(exampleFilepath, ENCODING)
    }

    const currentEnvExample = dotenv.configDotenv({ path: exampleFilepath }).parsed
    const injected = {}
    const preExisted = {}

    for (const key of [...keys]) {
      if (key in currentEnvExample) {
        preExisted[key] = currentEnvExample[key]
      } else {
        envExampleFile += `${key}=""\n`

        addedKeys.add(key)

        injected[key] = ''
      }
    }

    return {
      envExampleFile,
      envFile: this.envFile,
      exampleFilepath,
      addedKeys: [...addedKeys],
      injected,
      preExisted
    }
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Genexample
