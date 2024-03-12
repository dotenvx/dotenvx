const { execSync } = require('child_process')

function gitRoot () {
  try {
    // Redirect standard error to null to suppress Git error messages
    const root = execSync('git rev-parse --show-toplevel 2> /dev/null').toString().trim()
    return root
  } catch (_error) {
    return null
  }
}

module.exports = gitRoot
