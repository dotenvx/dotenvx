const fs = require('node:fs')
const resolveEnvarmorPath = require('../../lib/envarmor/parsing/resolveEnvarmorPath')
const path = require('node:path')
const { profile, policy, parse } = require('@dotenvx/primitives')
const checkResolvedEnv = require('../../lib/envarmor/validation/checkResolvedEnv')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = async function primitivesCheck () {
  try {
    const source = fs.readFileSync(resolveEnvarmorPath())
    const file = profile(source, { f: this.opts().file ?? '.env' })
    const rules = policy(source, file)
    const inherited = { ...process.env }
    const processEnv = { ...inherited }
    const processedEnvs = []
    const keys = new Set(Object.keys(rules.keys))
    for (const filename of file === '' ? [] : file.split(',')) {
      const original = fs.readFileSync(filename, 'utf8')
      const { parsed, injected, existed, errors } = await parse(original, {
        processEnv,
        fk: path.join(path.dirname(filename), '.env.keys')
      })
      if (errors.length) throw new Error('Could not decrypt selected environment files')
      for (const key of Object.keys(parsed)) keys.add(key)
      processedEnvs.push({
        type: 'envFile',
        filepath: filename,
        src: original,
        parsed,
        injected: Object.fromEntries(Object.entries(injected).filter(([key]) => !Object.hasOwn(inherited, key))),
        existed
      })
      for (const [key, value] of Object.entries(injected)) {
        Object.defineProperty(processEnv, key, { value, enumerable: true, writable: true, configurable: true })
      }
    }
    const finalEnv = Object.fromEntries([...keys].filter(key => Object.hasOwn(processEnv, key)).map(key => [key, processEnv[key]]))
    const inheritedValues = Object.fromEntries([...keys].filter(key => Object.hasOwn(inherited, key)).map(key => [key, inherited[key]]))
    processedEnvs.unshift({
      type: 'env',
      inherited: true,
      existed: inheritedValues,
      originalValues: Object.fromEntries(Object.entries(inheritedValues).map(([key, value]) => [key, [value]]))
    })
    const result = checkResolvedEnv({ ...rules, exists: true }, finalEnv, processedEnvs, {
      policyForFile: filename => policy(source, filename)
    })
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return { exitCode: result.errors.length ? 1 : 0 }
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
