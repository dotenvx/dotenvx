function buildOauthError (statusCode, json) {
  const code = json.error
  const message = `[${code}] ${json.error_description}`
  const help = `[${code}] ${JSON.stringify(json)}`

  const error = new Error(message)
  error.code = code
  error.help = help
  error.statusCode = statusCode

  return error
}

module.exports = buildOauthError
