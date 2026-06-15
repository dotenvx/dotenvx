function buildApiError (statusCode, json) {
  const code = json.error.code || statusCode.toString()
  const message = `[${code}] ${json.error.message}`
  const help = `[${code}] ${json.error.help || JSON.stringify(json)}`
  const meta = json.error.meta

  const error = new Error(message)
  error.code = code
  error.help = help
  error.meta = meta
  error.json = json

  return error
}

module.exports = buildApiError
