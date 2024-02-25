const t = require('tap')
const path = require('path')

const Genexample = require('../../../src/lib/services/genexample')

t.test('#run', ct => {
  const genexample = new Genexample('tests/monorepo/apps/frontend')

  const {
    content,
    injected,
    preExisted,
  } = genexample.run()

  const output = `# .env.example
HELLO=""
`
  ct.same(content, output)
  ct.same(injected, { HELLO: '' })
  ct.same(preExisted, {})

  ct.end()
})

t.test('#run (string envFile)', ct => {
  const genexample = new Genexample('tests/monorepo/apps/frontend', '.env')

  const {
    content,
    injected,
    preExisted,
  } = genexample.run()

  const output = `# .env.example
HELLO=""
`
  ct.same(content, output)
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
