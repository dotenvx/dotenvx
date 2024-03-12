const { execSync } = require('child_process')

function gitUrl () {
  try {
    // Redirect standard error to null to suppress Git error messages
    const url = execSync('git remote get-url origin 2> /dev/null').toString().trim()
    return url
  } catch (_error) {
    return null
  }
}

module.exports = gitUrl
