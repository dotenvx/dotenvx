const { fdir: Fdir } = require('fdir')
const path = require('path')
const picomatch = require('picomatch')

function patternsFor (value) {
  if (!Array.isArray(value)) {
    return [`**/${value}`]
  }

  return value.map(part => `**/${part}`)
}

function excludePatternsFor (value) {
  if (!Array.isArray(value)) {
    return [`**/${value}`]
  }

  return value.map(part => `**/${part}`)
}

function ls (options = {}) {
  const ignore = ['node_modules/**', '**/node_modules/**', '.git/**', '**/.git/**']
  const cwd = path.resolve(options.directory || './')
  const envFile = options.envFile || ['.env*']
  const excludeEnvFile = options.excludeEnvFile || []
  const excludePatterns = excludePatternsFor(excludeEnvFile)
  const excludes = excludePatterns.length > 0 ? ignore.concat(excludePatterns) : ignore
  const exclude = picomatch(excludes, { dot: true })
  const include = picomatch(patternsFor(envFile), {
    dot: true,
    ignore: excludes
  })

  return new Fdir()
    .withRelativePaths()
    .filter((filepath) => !exclude(filepath) && include(filepath))
    .crawl(cwd)
    .sync()
}

module.exports = ls
