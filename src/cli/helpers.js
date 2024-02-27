const path = require('path')
const childProcess = require('child_process')

const sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// resolve path based on current running process location
const resolvePath = function (filepath) {
  return path.resolve(process.cwd(), filepath)
}

const pluralize = function (word, count) {
  // simple pluralization: add 's' at the end
  if (count === 0 || count > 1) {
    return word + 's'
  } else {
    return word
  }
}

const getRemoteOriginUrl = function () {
  try {
    const url = childProcess.execSync('git remote get-url origin 2> /dev/null').toString().trim()
    return url
  } catch (_error) {
    return null
  }
}

const extractUsernameName = function (url) {
  // Removing the protocol part and splitting by slashes and colons
  // Removing the protocol part and .git suffix, then splitting by slashes and colons
  const parts = url.replace(/(^\w+:|^)\/\//, '').replace(/\.git$/, '').split(/[/:]/)

  // Extract the 'username/repository' part
  return parts.slice(-2).join('/')
}

module.exports = {
  sleep,
  resolvePath,
  pluralize,
  getRemoteOriginUrl,
  extractUsernameName
}
