// Event metadata is an allowlist, not a copy of command options or debug logs.
const fields = new Set(['key', 'file', 'files', 'changed', 'output', 'action', 'phase', 'decision', 'reason', 'error_code', 'error_count', 'warning_count', 'result_count', 'injected_count', 'proxied_count', 'exit_code', 'signal', 'duration_ms', 'filter', 'ignore', 'scope', 'executable'])
const optionFields = new Set(['envFile', 'envKeysFile', 'key', 'includeKey', 'excludeKey', 'stdout', 'plain', 'armor', 'native', '1password', 'bitwarden', 'create', 'overload', 'all', 'strict', 'convention', 'ignore', 'mask', 'redact', 'format', 'prettyPrint', 'pp', 'docker', 'gitFile', 'gitProcess', 'quiet', 'verbose', 'debug', 'logLevel', 'path', 'encoding', 'override', 'encrypt', 'noArmor', 'noNative', 'no1Password', 'noBitwarden'])

function value (input) {
  if (input === null || typeof input === 'boolean') return input
  if (typeof input === 'number' && Number.isFinite(input)) return input
  if (typeof input === 'string') return input.slice(0, 1024)
  if (Array.isArray(input)) return input.slice(0, 100).map(item => value(item)).filter(item => item !== undefined && !Array.isArray(item))
}

function select (input, allowed) {
  const output = {}
  for (const key of allowed) {
    const selected = value(input[key])
    if (selected !== undefined) output[key] = selected
  }
  return output
}

module.exports = {
  metadata: input => select(input, fields),
  options: input => select(input, optionFields),
  errorCode: error => /^[A-Z][A-Z0-9_]{0,79}$/.test(error && error.code) ? error.code : 'COMMAND_FAILED'
}
