const t = require('tap')

const isTeamRequiredError = require('../../../src/lib/helpers/isTeamRequiredError')

t.equal(isTeamRequiredError({ code: 'DOTENVX_TEAM_REQUIRED' }), true)
t.equal(isTeamRequiredError({ code: 'TEAM_REQUIRED' }), true)
t.equal(isTeamRequiredError({ code: 'PERMISSION_DENIED' }), false)
t.equal(isTeamRequiredError(), false)
