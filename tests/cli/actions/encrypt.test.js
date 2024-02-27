const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')
const dotenv = require('dotenv')

const main = require('../../../src/lib/main')
const encrypt = require('../../../src/cli/actions/encrypt')

t.test('encrypt (when .env file does not exist)', async ct => {
  const optsStub = sinon.stub().returns({})
  const exitStub = sinon.stub(process, 'exit')
  const fakeContext = {
    opts: optsStub
  }

  // Call the encrypt function with the fake context
  await encrypt.call(fakeContext, '.')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  exitStub.restore()

  ct.end()
})

t.test('encrypt (when different error not having help or code occurs)', async ct => {
  const mainStub = sinon.stub(main, 'encrypt').throws(new Error('other error'))
  const exitStub = sinon.stub(process, 'exit')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the encrypt function with the fake context
  await encrypt.call(fakeContext, '.')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  mainStub.restore()
  exitStub.restore()

  ct.end()
})

t.test('encrypt (when .env file exists)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')

  // run encrypt
  const fakeContext = { opts: sinon.stub().returns({}) }
  await encrypt.call(fakeContext, 'tmp')

  const envVault = dotenv.configDotenv({ path: 'tmp/.env.vault' }).parsed
  const envKeys = dotenv.configDotenv({ path: 'tmp/.env.keys' }).parsed

  t.ok(envVault.DOTENV_VAULT_DEVELOPMENT, '.env.vault contains DOTENV_VAULT_DEVELOPMENT')
  t.ok(envKeys.DOTENV_KEY_DEVELOPMENT, '.env.keys contains DOTENV_KEY_DEVELOPMENT')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  ct.end()
})

t.test('encrypt (when .env and .env.keys exists)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')
  fs.writeFileSync('tmp/.env.keys', 'DOTENV_KEY_DEVELOPMENT="dotenv://:key_3a0eefe9cdda9b597825ebabc7c8c2e455963ca1efad639a0a6a143d9f4dd84b@dotenvx.com/vault/.env.vault?environment=development"')

  // run encrypt
  const fakeContext = { opts: sinon.stub().returns({}) }
  await encrypt.call(fakeContext, 'tmp')

  const envVault = dotenv.configDotenv({ path: 'tmp/.env.vault' }).parsed
  const envKeys = dotenv.configDotenv({ path: 'tmp/.env.keys' }).parsed

  t.ok(envVault.DOTENV_VAULT_DEVELOPMENT, '.env.vault contains DOTENV_VAULT_DEVELOPMENT')
  t.ok(envKeys.DOTENV_KEY_DEVELOPMENT, '.env.keys contains DOTENV_KEY_DEVELOPMENT')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  ct.end()
})

t.test('encrypt (when .env, .env.keys, and .env.vault exists)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')
  fs.writeFileSync('tmp/.env.keys', 'DOTENV_KEY_DEVELOPMENT="dotenv://:key_3a0eefe9cdda9b597825ebabc7c8c2e455963ca1efad639a0a6a143d9f4dd84b@dotenvx.com/vault/.env.vault?environment=development"')
  fs.writeFileSync('tmp/.env.vault', 'DOTENV_VAULT_DEVELOPMENT="VLl5KNUU23zt4inKfw7eLx4/CkJGhf51z5lpTiWkWPeH6433Yq0r"')

  // run encrypt
  const fakeContext = { opts: sinon.stub().returns({}) }
  await encrypt.call(fakeContext, 'tmp')

  const envVault = dotenv.configDotenv({ path: 'tmp/.env.vault' }).parsed
  const envKeys = dotenv.configDotenv({ path: 'tmp/.env.keys' }).parsed

  t.ok(envVault.DOTENV_VAULT_DEVELOPMENT, '.env.vault contains DOTENV_VAULT_DEVELOPMENT')
  t.ok(envKeys.DOTENV_KEY_DEVELOPMENT, '.env.keys contains DOTENV_KEY_DEVELOPMENT')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  ct.end()
})
