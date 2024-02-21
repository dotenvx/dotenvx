const capcon = require('capture-console')
const t = require('tap')

const createSpinner = require('../../src/shared/createSpinner')

t.test('spinner.warn', (ct) => {
  const spinner = createSpinner('encrypting')
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.warn(message)
  })

  ct.equal(stdout, '')

  ct.end()
})

t.test('spinner.info', (ct) => {
  const spinner = createSpinner('encrypting')
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.info(message)
  })

  ct.equal(stdout, '')

  ct.end()
})

t.test('spinner.info (undefined)', (ct) => {
  const spinner = createSpinner()
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.info(message)
  })

  ct.equal(stdout, '')

  ct.end()
})
