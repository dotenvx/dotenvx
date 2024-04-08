const Conf = require('conf')
const dotenv = require('dotenv')
const packageJson = require('./../lib/helpers/packageJson')

function jsonToEnv (json) {
  return Object.entries(json).map(function ([key, value]) {
    return key + '=' + `"${value}"`
  }).join('\n')
}

function convertFullUsernameToEnvFormat (fullUsername) {
  // gh/motdotla => GH_MOTDOTLA_DOTENVX_TOKEN
  return fullUsername
    .toUpperCase()
    .replace(/\//g, '_') // Replace all slashes with underscores
    .concat('_DOTENVX_TOKEN') // Append '_DOTENVX_TOKEN' at the end
}

function findFirstMatchingKey (data) {
  const dotenvxTokenValue = data.DOTENVX_TOKEN

  for (const [key, value] of Object.entries(data)) {
    if (key !== 'DOTENVX_TOKEN' && value === dotenvxTokenValue) {
      return key
    }
  }

  return null // Return null if no matching key is found
}

function parseUsernameFromTokenKey (key) {
  // Remove the leading GH_/GL_ and trailing '_DOTENVX_TOKEN'
  const modifiedKey = key.replace(/^(GH_|GL_)/, '').replace(/_DOTENVX_TOKEN$/, '')

  // Convert to lowercase
  return modifiedKey.toLowerCase()
}

const confStore = new Conf({
  projectName: 'dotenvx',
  configName: '.env',
  // looks better on user's machine
  // https://github.com/sindresorhus/conf/tree/v10.2.0#projectsuffix.
  projectSuffix: '',
  fileExtension: '',
  // in the spirit of dotenv and format inherently puts limits on config complexity
  serialize: function (json) {
    return jsonToEnv(json)
  },
  // Convert .env format to an object
  deserialize: function (env) {
    return dotenv.parse(env)
  }
})

const getHostname = function () {
  return confStore.get('DOTENVX_HOSTNAME') || 'https://hub.dotenvx.com'
}

const getUsername = function () {
  const key = findFirstMatchingKey(confStore.store)

  if (key) {
    return parseUsernameFromTokenKey(key)
  } else {
    return null
  }
}

const getToken = function () {
  return confStore.get('DOTENVX_TOKEN')
}

const getLatestVersion = function () {
  return confStore.get('DOTENVX_LATEST_VERSION') || packageJson.version
}

const getLatestVersionLastChecked = function () {
  return parseInt(confStore.get('DOTENVX_LATEST_VERSION_LAST_CHECKED') || 0)
}

const setToken = function (fullUsername, accessToken) {
  // current logged in user
  confStore.set('DOTENVX_TOKEN', accessToken)

  // for future use to switch between accounts locally
  const memory = convertFullUsernameToEnvFormat(fullUsername)
  confStore.set(memory, accessToken)

  return accessToken
}

const setHostname = function (hostname) {
  confStore.set('DOTENVX_HOSTNAME', hostname)

  return hostname
}

const setLatestVersion = function (version) {
  confStore.set('DOTENVX_LATEST_VERSION', version)

  return version
}

const setLatestVersionLastChecked = function (dateNow) {
  confStore.set('DOTENVX_LATEST_VERSION_LAST_CHECKED', dateNow)

  return dateNow
}

const deleteToken = function () {
  // memory user
  const key = findFirstMatchingKey(confStore.store) // GH_MOTDOTLA_DOTENVX_TOKEN
  confStore.delete(key)

  // current logged in user
  confStore.delete('DOTENVX_TOKEN')

  return true
}

const deleteHostname = function () {
  confStore.delete('DOTENVX_HOSTNAME')

  return true
}

const configPath = function () {
  return confStore.path
}

module.exports = {
  confStore,
  getHostname,
  getToken,
  getUsername,
  getLatestVersion,
  getLatestVersionLastChecked,
  setHostname,
  setToken,
  setLatestVersion,
  setLatestVersionLastChecked,
  deleteToken,
  deleteHostname,
  configPath
}
