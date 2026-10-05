const fs = require('node:fs')
const path = require('node:path')
const { profile, policy, parse, check } = require('@dotenvx/primitives')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = async function primitivesCheck () {
  try {
    const source = fs.readFileSync('Envfile')
    const file = profile(source, { f: this.opts().file ?? '.env' })
    const rules = policy(source, file)
    const processEnv = { ...process.env }
    const keys = new Set(Object.keys(rules.keys))
    for (const filename of file === '' ? [] : file.split(',')) {
      const { parsed, injected, errors } = await parse(fs.readFileSync(filename), {
        processEnv,
        fk: path.join(path.dirname(filename), '.env.keys')
      })
      if (errors.length) throw new Error('Could not decrypt selected environment files')
      for (const key of Object.keys(parsed)) keys.add(key)
      for (const [key, value] of Object.entries(injected)) {
        Object.defineProperty(processEnv, key, { value, enumerable: true, writable: true, configurable: true })
      }
    }
    const finalEnv = Object.fromEntries([...keys].filter(key => Object.hasOwn(processEnv, key)).map(key => [key, processEnv[key]]))
    const result = check(rules, finalEnv)
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return { exitCode: result.errors.length ? 1 : 0 }
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
