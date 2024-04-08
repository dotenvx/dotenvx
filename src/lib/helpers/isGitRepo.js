const execa = require('execa')

function isGitRepo () {
  try {
    const raw = execa.sync('git', ['rev-parse', '--is-inside-work-tree'], { stderr: 'ignore' })
    const result = raw.stdout.toString().trim()
    return result === 'true'
  } catch (_error) {
    return false
  }
}

module.exports = isGitRepo
