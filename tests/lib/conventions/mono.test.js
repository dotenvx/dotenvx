const t = require('tap')

const mono = require('../../../src/lib/conventions/mono')

t.test('#mono', ct => {
  const envs = mono('mono')

  ct.same(envs, [
    { type: 'envFile', value: './../../.env' },
    { type: 'envFile', value: './../../.env.local' },
    { type: 'envFile', value: './../../.env.development' },
    { type: 'envFile', value: './../../.env.development.local' },
    { type: 'envFile', value: './../.env' },
    { type: 'envFile', value: './../.env.local' },
    { type: 'envFile', value: './../.env.development' },
    { type: 'envFile', value: './../.env.development.local' },
    { type: 'envFile', value: './.env' },
    { type: 'envFile', value: './.env.local' },
    { type: 'envFile', value: './.env.development' },
    { type: 'envFile', value: './.env.development.local' }
  ])

  ct.end()
})

t.test('#mono (process.env.NODE_ENV is test)', ct => {
  const originalNodeEnv = process.env.NODE_ENV

  process.env.NODE_ENV = 'test'

  const envs = mono()

  ct.same(envs, [
    { type: 'envFile', value: './../../.env' },
    { type: 'envFile', value: './../../.env.local' },
    { type: 'envFile', value: './../../.env.test' },
    { type: 'envFile', value: './../../.env.test.local' },
    { type: 'envFile', value: './../.env' },
    { type: 'envFile', value: './../.env.local' },
    { type: 'envFile', value: './../.env.test' },
    { type: 'envFile', value: './../.env.test.local' },
    { type: 'envFile', value: './.env' },
    { type: 'envFile', value: './.env.local' },
    { type: 'envFile', value: './.env.test' },
    { type: 'envFile', value: './.env.test.local' }
  ])

  if (originalNodeEnv) {
    process.env.NODE_ENV = originalNodeEnv
  } else {
    delete process.env.NODE_ENV
  }

  ct.end()
})

t.test('#mono (process.env.PACKAGE_NAME is server)', ct => {
  const originalPackageName = process.env.PACKAGE_NAME

  process.env.PACKAGE_NAME = 'server'

  const envs = mono()

  ct.same(envs, [
    { type: 'envFile', value: './../../.env' },
    { type: 'envFile', value: './../../.env.local' },
    { type: 'envFile', value: './../../.env.development' },
    { type: 'envFile', value: './../../.env.development.local' },
    { type: 'envFile', value: './../../.env.server' },
    { type: 'envFile', value: './../../.env.server.local' },
    { type: 'envFile', value: './../../.env.server.development' },
    { type: 'envFile', value: './../../.env.server.development.local' },
    { type: 'envFile', value: './../.env' },
    { type: 'envFile', value: './../.env.local' },
    { type: 'envFile', value: './../.env.development' },
    { type: 'envFile', value: './../.env.development.local' },
    { type: 'envFile', value: './../.env.server' },
    { type: 'envFile', value: './../.env.server.local' },
    { type: 'envFile', value: './../.env.server.development' },
    { type: 'envFile', value: './../.env.server.development.local' },
    { type: 'envFile', value: './.env' },
    { type: 'envFile', value: './.env.local' },
    { type: 'envFile', value: './.env.development' },
    { type: 'envFile', value: './.env.development.local' },
    { type: 'envFile', value: './.env.server' },
    { type: 'envFile', value: './.env.server.local' },
    { type: 'envFile', value: './.env.server.development' },
    { type: 'envFile', value: './.env.server.development.local' }
  ])

  if (originalPackageName) {
    process.env.PACKAGE_NAME = originalPackageName
  } else {
    delete process.env.PACKAGE_NAME
  }

  ct.end()
})

t.test('#mono (process.env.CWD is /server)', ct => {
  const originalCwd = process.env.CWD

  process.env.CWD = '/server'

  const envs = mono()

  ct.same(envs, [
    { type: 'envFile', value: '/server/../../.env' },
    { type: 'envFile', value: '/server/../../.env.local' },
    { type: 'envFile', value: '/server/../../.env.development' },
    { type: 'envFile', value: '/server/../../.env.development.local' },
    { type: 'envFile', value: '/server/../.env' },
    { type: 'envFile', value: '/server/../.env.local' },
    { type: 'envFile', value: '/server/../.env.development' },
    { type: 'envFile', value: '/server/../.env.development.local' },
    { type: 'envFile', value: '/server/.env' },
    { type: 'envFile', value: '/server/.env.local' },
    { type: 'envFile', value: '/server/.env.development' },
    { type: 'envFile', value: '/server/.env.development.local' }
  ])

  if (originalCwd) {
    process.env.CWD = originalCwd
  } else {
    delete process.env.CWD
  }

  ct.end()
})

t.test('#mono (process.env.MAX_DEPTH is 0)', ct => {
  const originalMaxDepth = process.env.MAX_DEPTH

  process.env.MAX_DEPTH = '0'

  const envs = mono()

  ct.same(envs, [
    { type: 'envFile', value: './.env' },
    { type: 'envFile', value: './.env.local' },
    { type: 'envFile', value: './.env.development' },
    { type: 'envFile', value: './.env.development.local' }
  ])

  if (originalMaxDepth) {
    process.env.MAX_DEPTH = originalMaxDepth
  } else {
    delete process.env.MAX_DEPTH
  }

  ct.end()
})
