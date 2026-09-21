const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')
const patterns = require('./precommitEnvPatterns')

const git = (...args) => execFileSync('git', ['config', '--global', ...args], { encoding: 'utf8' }).trim()
function get (key, pathname = false) {
  try { return git('--includes', ...(pathname ? ['--path'] : []), '--get', key) } catch (error) {
    if (error.status !== 1) throw error
    return ''
  }
}
function file (key, name) {
  return get(key, true) || path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'git', name)
}
function read (filename) {
  return fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : ''
}
function removeLines (filename, lines) {
  const current = read(filename)
  const updated = current.split(/(?<=\n)/).filter(line => !lines.includes(line.replace(/\r?\n$/, ''))).join('')
  if (updated !== current) fs.writeFileSync(filename, updated)
}
function state () {
  const attributes = read(file('core.attributesFile', 'attributes'))
  const filter = ['dotenvx', 'dotenvx.protect'].some(driver => {
    const clean = get(`filter.${driver}.clean`)
    const processFilter = get(`filter.${driver}.process`)
    const recognized = processFilter ? / protect --git-process$/.test(processFilter) : /(?:protect --git-file|precommit --clean) %f$/.test(clean)
    return recognized && get(`filter.${driver}.required`) === 'true' && attributes.split(/\r?\n/).some(line => line.endsWith(` filter=${driver}`))
  })
  const ignore = read(file('core.excludesFile', 'ignore')).split(/\r?\n/).includes('.env.keys*')
  return { filter, ignore, configured: get('dotenvx.protect.configured') === 'true' || filter || ignore }
}
function removeFilter () {
  const drivers = ['dotenvx', 'dotenvx.protect']
  for (const driver of drivers) {
    const processFilter = get(`filter.${driver}.process`)
    if (processFilter && !/ protect --git-process$/.test(processFilter)) throw new Error(`Custom filter.${driver}.process found; remove it manually to disable protection.`)
    const clean = get(`filter.${driver}.clean`)
    if (clean && clean !== 'cat' && !/(?:protect --git-file|precommit --clean) %f$/.test(clean)) {
      throw new Error(`Custom filter.${driver}.clean found; remove it manually to disable protection.`)
    }
  }
  removeLines(file('core.attributesFile', 'attributes'), drivers.flatMap(driver => patterns.map(pattern => `${pattern.includes('/') ? '**/' : ''}${pattern} filter=${driver}`)))
  // Keep any remaining or inherited attributes harmless, including custom patterns.
  for (const driver of drivers) {
    git(`filter.${driver}.required`, 'false')
    git(`filter.${driver}.process`, '')
    git(`filter.${driver}.clean`, 'cat')
  }
}
function removeIgnore () {
  const filename = file('core.excludesFile', 'ignore')
  if (!read(filename).split(/\r?\n/).includes('.env.keys*')) return
  if (get('dotenvx.protect.ignoreFile', true) !== filename) {
    throw new Error(`The existing .env.keys* rule in ${filename} has no dotenvx ownership record. Remove it manually to disable it; other ignore rules will be preserved.`)
  }
  removeLines(filename, ['.env.keys*'])
  git('--unset-all', 'dotenvx.protect.ignoreFile')
}
module.exports = { state, removeFilter, removeIgnore, markConfigured: () => git('dotenvx.protect.configured', 'true') }
