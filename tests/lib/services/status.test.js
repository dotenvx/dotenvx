const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const Status = require('../../../src/lib/services/status')

t.test('#run', ct => {
  const {
    changes,
    nochanges,
    untracked
  } = new Status('tests/monorepo/apps/backend').run()

  ct.same(changes, [])
  ct.same(nochanges[0].filename, '.env')
  ct.same(untracked[0].filename, '.env.untracked')

  ct.end()
})

t.test('#run (when .env different than .env.vault contents)', ct => {
  const originalReadFileSync = fs.readFileSync
  const sandbox = sinon.createSandbox()
  sandbox.stub(fs, 'readFileSync').callsFake((filepath, options) => {
    if (filepath === path.resolve('tests/monorepo/apps/backend/.env')) {
      return 'HELLO=changes'
    } else {
      return originalReadFileSync(filepath, options)
    }
  })

  const {
    changes,
    nochanges
  } = new Status('tests/monorepo/apps/backend').run()

  ct.same(nochanges, [])
  ct.same(changes[0].filename, '.env')
  ct.same(changes[0].differences, [
    {
      count: 10,
      added: undefined,
      removed: true,
      value: '# for testing purposes only\n'
    },
    { count: 2, value: 'HELLO=' },
    { count: 4, added: undefined, removed: true, value: '"backend"\n' },
    { count: 1, added: true, removed: undefined, value: 'changes' }
  ])

  ct.end()
})

t.test('#run (when in a parent directory of .envs it skips any directories)', ct => {
  const {
    changes,
    nochanges
  } = new Status('tests/monorepo/apps/').run()

  ct.same(changes, [])
  ct.same(nochanges, [])

  ct.end()
})
