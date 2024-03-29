'use strict'

const { request } = require('undici')

/**
 * Returns the latest version of a package under a certain tag
 * @param {string} packageName
 * @param {string} tag
 * @returns {Promise<string?>}
 */
const latestVersion = async (packageName, tag) => {
  const response = await request(`https://registry.npmjs.org/${packageName}/${tag}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
      'Content-Type': 'application/json'
    }
  })

  if (response.statusCode !== 200) {
    return null
  }

  const data = await response.body.json()
  return data.version
}

module.exports = latestVersion
