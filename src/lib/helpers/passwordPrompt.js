// prompt for a password
const { read } = require('read')

async function promptForNewPassword () {
  const password = await read({
    prompt: 'enter password> ', silent: true, replace: '*'
  })
  const confirm = await read({
    prompt: 'confirm password> ', silent: true, replace: '*'
  })
  if (password !== confirm) {
    throw new Error('passwords do not match')
  } else {
    return password
  }
}

module.exports = { promptForNewPassword }
