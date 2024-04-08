const execa = require('execa')

function gitUrl () {
  try {
    // Redirect standard error to null to suppress Git error messages
    const raw = execa.sync('git', ['remote', 'get-url', 'origin'])
    const result = raw.stdout.toString().trim()
    return result
  } catch (_error) {
    return null
  }
}

module.exports = gitUrl
