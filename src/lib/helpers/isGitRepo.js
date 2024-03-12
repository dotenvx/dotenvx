const { execSync } = require('child_process')

function isGitRepo () {
  try {
    // Redirect standard error to null to suppress Git error messages
    const result = execSync('git rev-parse --is-inside-work-tree 2> /dev/null').toString().trim()
    return result === 'true'
  } catch (_error) {
    return false
  }
}

module.exports = isGitRepo
