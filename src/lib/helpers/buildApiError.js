function buildApiError (statusCode, json) {
  const code = json.error.code || statusCode.toString()
  const message = `[${code}] ${json.error.message}`
  const help = json.error.help ? `fix: [${json.error.help}]` : `[${code}] ${JSON.stringify(json)}`
  const meta = json.error.meta

  const error = new Error(message)
  error.code = code
  error.help = help
  if (json.error.help) {
    error.messageWithHelp = `${message}. ${help}`
  }
  error.meta = meta
  error.json = json

  return error
}

module.exports = buildApiError
