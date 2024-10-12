const fs = require('fs')
const ignore = require('ignore')

function isIgnoringDotenvKeys () {
  if (!fs.existsSync('.gitignore')) {
    return false
  }

  const gitignore = fs.readFileSync('.gitignore').toString()
  const ig = ignore(gitignore).add(gitignore)

  if (!ig.ignores('.env.keys')) {
    return false
  }

  return true
}

module.exports = isIgnoringDotenvKeys
