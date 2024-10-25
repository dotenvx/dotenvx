const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const path = require('path')
const sinon = require('sinon')

const Genexample = require('../../../src/lib/services/genexample')

t.test('#run', ct => {
  const genexample = new Genexample('tests/monorepo/apps/frontend')

  const {
    envExampleFile,
    injected,
    preExisted
  } = genexample.run()

  const output = `# .env.example - generated with dotenvx

# for testing purposes only
HELLO="" # this is a comment
`
  ct.same(envExampleFile, output)
  ct.same(injected, { HELLO: '' })
  ct.same(preExisted, {})

  ct.end()
})

t.test('#run (.env.example already exists)', ct => {
  const genexample = new Genexample('tests/monorepo/apps/backend')

  const {
    envExampleFile,
    injected,
    preExisted
  } = genexample.run()

  const output = `# .env.example - generated with dotenvx
HELLO=''
`
  ct.same(envExampleFile, output)
  ct.same(injected, {})
  ct.same(preExisted, { HELLO: '' })

  ct.end()
})

t.test('#run (.env.example already exists but with different keys)', ct => {
  const originalReadFileSync = fsx.readFileX
  const sandbox = sinon.createSandbox()
  sandbox.stub(fsx, 'readFileX').callsFake((filepath, options) => {
    if (filepath === path.resolve('tests/monorepo/apps/backend/.env')) {
      return 'HELLO=world\nHELLO2=universe'
    } else {
      return originalReadFileSync(filepath, options)
    }
  })

  const genexample = new Genexample('tests/monorepo/apps/backend')

  const {
    envExampleFile,
    injected,
    preExisted
  } = genexample.run()

  const output = `# .env.example - generated with dotenvx
HELLO=''
HELLO2=''
`

  ct.same(envExampleFile, output)
  ct.same(injected, { HELLO2: '' })
  ct.same(preExisted, { HELLO: '' })

  ct.end()
})

t.test('#run (string envFile)', ct => {
  const genexample = new Genexample('tests/monorepo/apps/frontend', '.env')

  const {
    envExampleFile,
    injected,
    preExisted
  } = genexample.run()

  const output = `# .env.example - generated with dotenvx

# for testing purposes only
HELLO="" # this is a comment
`
  ct.same(envExampleFile, output)
  ct.same(injected, { HELLO: '' })
  ct.same(preExisted, {})

  ct.end()
})

t.test('#run (cant find directory)', ct => {
  try {
    new Genexample('tests/monorepo/apps/frontendzzzz').run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.message, 'missing directory (tests/monorepo/apps/frontendzzzz)')
  }

  ct.end()
})

t.test('#run (missing env files)', ct => {
  try {
    new Genexample('tests/monorepo/apps/frontend', []).run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.code, 'MISSING_ENV_FILES')
    ct.equal(error.message, 'no .env* files found')
    ct.equal(error.help, '? add one with [echo "HELLO=World" > .env] and then run [dotenvx genexample]')
  }

  ct.end()
})

t.test('#run (non-existant .env file)', ct => {
  try {
    new Genexample('tests/monorepo/apps/frontend', ['.env.nonexistant']).run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.code, 'MISSING_ENV_FILE')
    ct.equal(error.message, `file does not exist at [${path.resolve('tests/monorepo/apps/frontend/.env.nonexistant')}]`)
    ct.equal(error.help, '? add it with [echo "HELLO=World" > .env.nonexistant] and then run [dotenvx genexample]')
  }

  ct.end()
})
