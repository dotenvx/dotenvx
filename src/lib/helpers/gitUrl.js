const execa = require('execa')

function gitUrl () {
  try {
    const raw = execa.sync('git', ['remote', 'get-url', 'origin'])

    return raw.stdout.toString().trim()
  } catch (_error) {
    return null
  }
}

module.exports = gitUrl
