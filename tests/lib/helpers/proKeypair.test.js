const t = require('tap')
const sinon = require('sinon')
const childProcess = require('child_process')

const ProKeypair = require('../../../src/lib/helpers/proKeypair')

t.test('#proKeypair', ct => {
  const keypairs = new ProKeypair('tests/monorepo/apps/app1/.env').run()

  ct.same(keypairs, { DOTENV_PUBLIC_KEY: null, DOTENV_PRIVATE_KEY: null })

  ct.end()
})

t.test('#proKeypair when childProcess fails', ct => {
  const stub = sinon.stub(childProcess, 'execSync').throws(new Error('Command failed'))

  const keypairs = new ProKeypair('tests/monorepo/apps/app1/.env').run()

  ct.same(keypairs, { DOTENV_PUBLIC_KEY: null, DOTENV_PRIVATE_KEY: null })

  stub.restore()

  ct.end()
})
