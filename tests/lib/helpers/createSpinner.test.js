const t = require('tap')

const createSpinner = require('../../../src/lib/helpers/createSpinner')

t.test('createSpinner returns null when disabled', async (ct) => {
  const previousIsTTY = process.stderr.isTTY
  process.stderr.isTTY = false

  const spinner = await createSpinner()
  ct.equal(spinner, null)

  process.stderr.isTTY = previousIsTTY
  ct.end()
})

t.test('createSpinner creates and starts spinner when enabled', async (ct) => {
  const previousIsTTY = process.stderr.isTTY
  const previousCursorTo = process.stderr.cursorTo
  const previousClearLine = process.stderr.clearLine
  process.stderr.isTTY = true
  process.stderr.cursorTo = () => {}
  process.stderr.clearLine = () => {}

  const spinner = await createSpinner()
  ct.type(spinner, 'object')
  ct.type(spinner.stop, 'function')
  spinner.stop()

  process.stderr.isTTY = previousIsTTY
  process.stderr.cursorTo = previousCursorTo
  process.stderr.clearLine = previousClearLine
  ct.end()
})
