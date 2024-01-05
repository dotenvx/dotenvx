const Conf = require('conf')
const main = require('./../lib/main')

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
    return main.parse(env)
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

const configPath = function () {
  return confStore.path
}

module.exports = {
  getHostname,
  getToken,
  getUsername,
  setHostname,
  setToken,
  configPath
}
