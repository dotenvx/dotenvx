const t = require('tap')

const normalizeDotenvConfigPath = require('../../../src/lib/helpers/normalizeDotenvConfigPath')

t.test('#normalizeDotenvConfigPath', t => {
  t.same(
    normalizeDotenvConfigPath([], { DOTENV_F: '.env.production' }),
    [{ type: 'envFile', value: '.env.production' }],
    'uses DOTENV_F when no env file was specified'
  )

  t.same(
    normalizeDotenvConfigPath([], { DOTENV_PATH: '.env.local, .env' }),
    [
      { type: 'envFile', value: '.env.local' },
      { type: 'envFile', value: '.env' }
    ],
    'supports DOTENV_PATH and comma-separated env files'
  )

  t.same(
    normalizeDotenvConfigPath([], {
      DOTENV_F: '.env.local',
      DOTENV_PATH: '.env.production'
    }),
    [{ type: 'envFile', value: '.env.local' }],
    'DOTENV_F takes precedence over DOTENV_PATH'
  )

  const explicitEnvs = [
    { type: 'envFile', value: '.env.local' },
    { type: 'env', value: 'HELLO=World' }
  ]
  t.same(
    normalizeDotenvConfigPath(explicitEnvs, { DOTENV_F: '.env.production' }),
    explicitEnvs,
    'explicit env files take precedence'
  )

  t.same(
    normalizeDotenvConfigPath([{ type: 'env', value: 'HELLO=World' }], {}),
    [{ type: 'env', value: 'HELLO=World' }],
    'leaves envs unchanged when unset'
  )

  t.end()
})
