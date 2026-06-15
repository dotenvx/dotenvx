const open = require('open')

async function openUrl (url) {
  return await open(url, { wait: false })
}

module.exports = openUrl
