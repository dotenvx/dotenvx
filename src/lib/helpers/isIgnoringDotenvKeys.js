const fsx = require('./fsx')
const ignore = require('ignore')

function isIgnoringDotenvKeys () {
  if (!fsx.existsSync('.gitignore')) {
    return false
  }

  const gitignore = fsx.readFileSync('.gitignore').toString()
  const ig = ignore(gitignore).add(gitignore)

  if (!ig.ignores('.env.keys')) {
    return false
  }

  return true
}

module.exports = isIgnoringDotenvKeys
