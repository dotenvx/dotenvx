const escape = require('./escape')

function enclavedHint (error, envFilepath) {
  if (error?.code !== 'ENCLAVED' || !envFilepath) return error
  const file = /^[a-zA-Z0-9_./-]+$/.test(envFilepath) ? envFilepath : escape(envFilepath)
  error.help = `hint: [dotenvx armor open -f ${file}]`
  error.messageWithHelp = `${error.message}. ${error.help}`
  return error
}

module.exports = enclavedHint
