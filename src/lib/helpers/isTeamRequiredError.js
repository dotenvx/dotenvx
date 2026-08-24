const TEAM_REQUIRED_CODES = new Set([
  'TEAM_REQUIRED',
  'DOTENVX_TEAM_REQUIRED'
])

function isTeamRequiredError (error) {
  return Boolean(error && TEAM_REQUIRED_CODES.has(error.code))
}

module.exports = isTeamRequiredError
