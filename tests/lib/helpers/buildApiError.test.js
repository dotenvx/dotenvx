const t = require('tap')

const buildApiError = require('../../../src/lib/helpers/buildApiError')

t.test('buildApiError includes API help in messageWithHelp', ct => {
  const error = buildApiError(400, {
    error: {
      code: 'DOTENVX_NO_TEAMS',
      message: 'create or join a team before running this command',
      help: 'https://github.com/dotenvx/dotenvx/issues/924',
      meta: null
    }
  })

  ct.equal(error.message, '[DOTENVX_NO_TEAMS] create or join a team before running this command')
  ct.equal(error.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/924]')
  ct.equal(error.messageWithHelp, '[DOTENVX_NO_TEAMS] create or join a team before running this command. fix: [https://github.com/dotenvx/dotenvx/issues/924]')
  ct.end()
})

t.test('buildApiError omits messageWithHelp when API help is absent', ct => {
  const error = buildApiError(400, {
    error: {
      code: 'BAD_REQUEST',
      message: 'bad request',
      help: null,
      meta: null
    }
  })

  ct.equal(error.message, '[BAD_REQUEST] bad request')
  ct.notOk(error.messageWithHelp)
  ct.end()
})
