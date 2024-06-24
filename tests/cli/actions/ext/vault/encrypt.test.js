const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')
const dotenv = require('dotenv')

const main = require('../../../../../src/lib/main')
const vaultEncrypt = require('../../../../../src/cli/actions/ext/vault/encrypt')

t.test('vaultEncrypt (when .env file does not exist)', async ct => {
  const optsStub = sinon.stub().returns({})
  const exitStub = sinon.stub(process, 'exit')
  const fakeContext = {
    opts: optsStub
  }

  // Call the encrypt function with the fake context
  await vaultEncrypt.call(fakeContext, '.')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  exitStub.restore()

  ct.end()
})

t.test('vaultEncrypt (when different error not having help or code occurs)', async ct => {
  const mainStub = sinon.stub(main, 'vaultEncrypt').throws(new Error('other error'))
  const exitStub = sinon.stub(process, 'exit')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the vaultEncrypt function with the fake context
  await vaultEncrypt.call(fakeContext, '.')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  mainStub.restore()
  exitStub.restore()

  ct.end()
})

t.test('vaultEncrypt (when .env file exists)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')

  // run vaultEncrypt
  const fakeContext = { opts: sinon.stub().returns({}) }
  await vaultEncrypt.call(fakeContext, 'tmp')

  const envVault = dotenv.configDotenv({ path: 'tmp/.env.vault' }).parsed
  const envKeys = dotenv.configDotenv({ path: 'tmp/.env.keys' }).parsed

  t.ok(envVault.DOTENV_VAULT_DEVELOPMENT, '.env.vault contains DOTENV_VAULT_DEVELOPMENT')
  t.ok(envKeys.DOTENV_KEY_DEVELOPMENT, '.env.keys contains DOTENV_KEY_DEVELOPMENT')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  ct.end()
})

t.test('vaultEncrypt (when .env and .env.keys exists)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')
  fs.writeFileSync('tmp/.env.keys', 'DOTENV_KEY_DEVELOPMENT="dotenv://:key_3a0eefe9cdda9b597825ebabc7c8c2e455963ca1efad639a0a6a143d9f4dd84b@dotenvx.com/vault/.env.vault?environment=development"')

  // run vaultEncrypt
  const fakeContext = { opts: sinon.stub().returns({}) }
  await vaultEncrypt.call(fakeContext, 'tmp')

  const envVault = dotenv.configDotenv({ path: 'tmp/.env.vault' }).parsed
  const envKeys = dotenv.configDotenv({ path: 'tmp/.env.keys' }).parsed

  t.ok(envVault.DOTENV_VAULT_DEVELOPMENT, '.env.vault contains DOTENV_VAULT_DEVELOPMENT')
  t.ok(envKeys.DOTENV_KEY_DEVELOPMENT, '.env.keys contains DOTENV_KEY_DEVELOPMENT')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  ct.end()
})

t.test('vaultEncrypt (when .env, .env.keys, and .env.vault exists)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')
  fs.writeFileSync('tmp/.env.keys', 'DOTENV_KEY_DEVELOPMENT="dotenv://:key_3a0eefe9cdda9b597825ebabc7c8c2e455963ca1efad639a0a6a143d9f4dd84b@dotenvx.com/vault/.env.vault?environment=development"')
  fs.writeFileSync('tmp/.env.vault', 'DOTENV_VAULT_DEVELOPMENT="VLl5KNUU23zt4inKfw7eLx4/CkJGhf51z5lpTiWkWPeH6433Yq0r"')

  // run vaultEncrypt
  const fakeContext = { opts: sinon.stub().returns({}) }
  await vaultEncrypt.call(fakeContext, 'tmp')

  const envVault = dotenv.configDotenv({ path: 'tmp/.env.vault' }).parsed
  const envKeys = dotenv.configDotenv({ path: 'tmp/.env.keys' }).parsed

  t.ok(envVault.DOTENV_VAULT_DEVELOPMENT, '.env.vault contains DOTENV_VAULT_DEVELOPMENT')
  t.ok(envKeys.DOTENV_KEY_DEVELOPMENT, '.env.keys contains DOTENV_KEY_DEVELOPMENT')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  ct.end()
})

t.test('vaultEncrypt (when .env, .env.keys, and .env.vault exists but .env.vault ciphertext is invalid)', async ct => {
  // setup
  try { fs.rmdirSync('tmp', { recursive: true }) } catch (_e) {}
  fs.mkdirSync('tmp')
  fs.writeFileSync('tmp/.env', 'HELLO=World')
  fs.writeFileSync('tmp/.env.keys', 'DOTENV_KEY_DEVELOPMENT="dotenv://:key_3a0eefe9cdda9b597825ebabc7c8c2e455963ca1efad639a0a6a143d9f4dd84b@dotenvx.com/vault/.env.vault?environment=development"')
  fs.writeFileSync('tmp/.env.vault', 'DOTENV_VAULT_DEVELOPMENT="invalid ciphertext"')

  const exitStub = sinon.stub(process, 'exit')
  const fakeContext = { opts: sinon.stub().returns({}) }

  // run vaultEncrypt
  await vaultEncrypt.call(fakeContext, 'tmp')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  // cleanup
  fs.rmdirSync('tmp', { recursive: true })

  exitStub.restore()

  ct.end()
})
