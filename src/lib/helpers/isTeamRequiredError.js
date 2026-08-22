function isTeamRequiredError (error) {
  return Boolean(error && error.code === 'TEAM_REQUIRED')
}

module.exports = isTeamRequiredError
