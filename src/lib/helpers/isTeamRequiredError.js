const TEAM_REQUIRED_CODES = new Set([
  'DOTENVX_TEAM_REQUIRED',
  'TEAM_REQUIRED'
])

function isTeamRequiredError (error) {
  return TEAM_REQUIRED_CODES.has(error && error.code)
}

module.exports = isTeamRequiredError
