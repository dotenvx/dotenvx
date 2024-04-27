const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const Decrypt = require('../../../src/lib/services/decrypt')

t.test('#run', ct => {
  const {
    processedEnvs,
    changedFilenames,
    unchangedFilenames
  } = new Decrypt('tests/monorepo/apps/backend').run()

  const expectedDecrypted = `# for testing purposes only
HELLO="backend"
`

  ct.same(processedEnvs, [{
    environment: 'development',
    dotenvKey: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development',
    ciphertext: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u',
    decrypted: expectedDecrypted,
    filename: '.env',
    filepath: path.resolve('tests/monorepo/apps/backend/.env')
  }])
  ct.same(changedFilenames, [])
  ct.same(unchangedFilenames, ['.env'])

  ct.end()
})

t.test('#run (when missing .env.vault file)', ct => {
  try {
    new Decrypt('tests/monorepo/apps/backend/missing').run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.message, `missing .env.vault (${path.resolve('tests/monorepo/apps/backend/missing', '.env.vault')})`)
  }

  ct.end()
})

t.test('#run (when missing .env.keys file)', ct => {
  const sandbox = sinon.createSandbox()
  sandbox.stub(fs, 'existsSync').callsFake((filepath) => {
    if (filepath === path.resolve('tests/monorepo/apps/backend/.env.keys')) {
      return false
    } else {
      return true
    }
  })

  try {
    new Decrypt('tests/monorepo/apps/backend').run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.message, `missing .env.keys (${path.resolve('tests/monorepo/apps/backend', '.env.keys')})`)
  }

  sandbox.restore()

  ct.end()
})

t.test('#run (decrypted .env does not exist)', ct => {
  const sandbox = sinon.createSandbox()
  sandbox.stub(fs, 'existsSync').callsFake((filepath) => {
    if (filepath === path.resolve('tests/monorepo/apps/backend/.env')) {
      return false
    } else {
      return true
    }
  })

  const {
    processedEnvs,
    changedFilenames,
    unchangedFilenames
  } = new Decrypt('tests/monorepo/apps/backend').run()

  const expectedDecrypted = `# for testing purposes only
HELLO="backend"
`

  ct.same(processedEnvs, [{
    environment: 'development',
    dotenvKey: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development',
    ciphertext: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u',
    decrypted: expectedDecrypted,
    filename: '.env',
    filepath: path.resolve('tests/monorepo/apps/backend/.env'),
    shouldWrite: true
  }])
  ct.same(changedFilenames, ['.env'])
  ct.same(unchangedFilenames, [])

  sandbox.restore()

  ct.end()
})

t.test('#run (decrypted .env is different than current .env)', ct => {
  const originalReadFileSync = fs.readFileSync
  const sandbox = sinon.createSandbox()
  sandbox.stub(fs, 'readFileSync').callsFake((filepath, options) => {
    if (filepath === path.resolve('tests/monorepo/apps/backend/.env')) {
      return ''
    } else {
      return originalReadFileSync(filepath, options)
    }
  })

  const {
    processedEnvs,
    changedFilenames,
    unchangedFilenames
  } = new Decrypt('tests/monorepo/apps/backend').run()

  const expectedDecrypted = `# for testing purposes only
HELLO="backend"
`

  ct.same(processedEnvs, [{
    environment: 'development',
    dotenvKey: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development',
    ciphertext: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u',
    decrypted: expectedDecrypted,
    filename: '.env',
    filepath: path.resolve('tests/monorepo/apps/backend/.env'),
    shouldWrite: true
  }])
  ct.same(changedFilenames, ['.env'])
  ct.same(unchangedFilenames, [])

  sandbox.restore()

  ct.end()
})

t.test('#run (.env.vault file is missing the DOTENV_VAULT_DEVELOPMENT key/value)', ct => {
  const originalReadFileSync = fs.readFileSync
  const sandbox = sinon.createSandbox()
  sandbox.stub(fs, 'readFileSync').callsFake((filepath, options) => {
    if (filepath === path.resolve('tests/monorepo/apps/backend/.env.vault')) {
      return ''
    } else {
      return originalReadFileSync(filepath, options)
    }
  })

  const {
    processedEnvs
  } = new Decrypt('tests/monorepo/apps/backend').run()

  ct.same(processedEnvs, [{
    environment: 'development',
    dotenvKey: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development',
    ciphertext: undefined,
    warning: new Error(`DOTENV_VAULT_DEVELOPMENT missing in .env.vault: ${path.resolve('tests/monorepo/apps/backend/.env.vault')}`)
  }])

  sandbox.restore()

  ct.end()
})

t.test('#run (--environment argument)', ct => {
  const {
    processedEnvs,
    changedFilenames,
    unchangedFilenames
  } = new Decrypt('tests/monorepo/apps/backend', ['development']).run()

  const expectedDecrypted = `# for testing purposes only
HELLO="backend"
`

  ct.same(processedEnvs, [{
    environment: 'development',
    dotenvKey: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development',
    ciphertext: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u',
    decrypted: expectedDecrypted,
    filename: '.env',
    filepath: path.resolve('tests/monorepo/apps/backend/.env')
  }])
  ct.same(changedFilenames, [])
  ct.same(unchangedFilenames, ['.env'])

  ct.end()
})

t.test('#run (--environment string argument)', ct => {
  const {
    processedEnvs,
    changedFilenames,
    unchangedFilenames
  } = new Decrypt('tests/monorepo/apps/backend', 'development').run()

  const expectedDecrypted = `# for testing purposes only
HELLO="backend"
`

  ct.same(processedEnvs, [{
    environment: 'development',
    dotenvKey: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development',
    ciphertext: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u',
    decrypted: expectedDecrypted,
    filename: '.env',
    filepath: path.resolve('tests/monorepo/apps/backend/.env')
  }])
  ct.same(changedFilenames, [])
  ct.same(unchangedFilenames, ['.env'])

  ct.end()
})

t.test('#run (--environment argument where environment does not exist)', ct => {
  const {
    processedEnvs
  } = new Decrypt('tests/monorepo/apps/backend', ['ci']).run()

  ct.same(processedEnvs, [{
    environment: 'ci',
    dotenvKey: undefined,
    ciphertext: undefined,
    warning: new Error(`DOTENV_VAULT_CI missing in .env.vault: ${path.resolve('tests/monorepo/apps/backend/.env.vault')}`)
  }])

  ct.end()
})
