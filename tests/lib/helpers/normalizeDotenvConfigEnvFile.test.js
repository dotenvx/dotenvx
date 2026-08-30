const t = require('tap')

const normalizeDotenvConfigEnvFile = require('../../../src/lib/helpers/normalizeDotenvConfigEnvFile')

t.test('#normalizeDotenvConfigEnvFile', t => {
  t.same(
    normalizeDotenvConfigEnvFile([], { DOTENV_CONFIG_ENV_FILE: '.env.production' }),
    [{ type: 'envFile', value: '.env.production' }],
    'uses DOTENV_CONFIG_ENV_FILE when no env file was specified'
  )

  t.same(
    normalizeDotenvConfigEnvFile([], { DOTENV_CONFIG_ENV_FILE: '.env.local, .env' }),
    [
      { type: 'envFile', value: '.env.local' },
      { type: 'envFile', value: '.env' }
    ],
    'supports comma-separated env files'
  )

  const explicitEnvs = [
    { type: 'envFile', value: '.env.local' },
    { type: 'env', value: 'HELLO=World' }
  ]
  t.same(
    normalizeDotenvConfigEnvFile(explicitEnvs, { DOTENV_CONFIG_ENV_FILE: '.env.production' }),
    explicitEnvs,
    'explicit env files take precedence'
  )

  t.same(
    normalizeDotenvConfigEnvFile([{ type: 'env', value: 'HELLO=World' }], {}),
    [{ type: 'env', value: 'HELLO=World' }],
    'leaves envs unchanged when unset'
  )

  t.end()
})
