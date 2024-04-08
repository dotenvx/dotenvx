const execa = require('execa')

function gitRoot () {
  try {
    // Redirect standard error to null to suppress Git error messages
    const raw = execa.sync('git', ['rev-parse', '--show-toplevel'], { stderr: 'ignore' })
    const result = raw.stdout.toString().trim()
    return result
  } catch (_error) {
    return null
  }
}

module.exports = gitRoot
