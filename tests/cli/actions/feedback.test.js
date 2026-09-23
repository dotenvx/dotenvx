const t = require('tap')
const sinon = require('sinon')
const { execFileSync } = require('child_process')
const feedback = require('../../../src/cli/actions/feedback')
const PostFeedback = require('../../../src/lib/api/postFeedback')
const Session = require('../../../src/db/session')
const prompts = require('../../../src/lib/helpers/prompts')
const { logger } = require('../../../src/shared/logger')

t.beforeEach(() => {
  sinon.stub(logger, 'success')
  sinon.stub(logger, 'error')
})
t.afterEach(() => sinon.restore())

const command = { opts: () => ({}) }

function setTTY (ct, value) {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value })
  ct.teardown(() => {
    if (descriptor) Object.defineProperty(process.stdin, 'isTTY', descriptor)
    else delete process.stdin.isTTY
  })
}

t.test('sends the supplied message to the configured hostname', async ct => {
  sinon.stub(Session.prototype, 'hostname').returns('https://example.com')
  const run = sinon.stub(PostFeedback.prototype, 'run').resolves({ ok: true })
  const prompt = sinon.stub(prompts, 'input')
  await feedback.call(command, 'Please improve this error')
  ct.equal(run.firstCall.thisValue.hostname, 'https://example.com')
  ct.equal(run.firstCall.thisValue.body, 'Please improve this error')
  ct.notOk(prompt.called)
  ct.ok(logger.success.calledOnce)
})

t.test('prompts in a terminal and supports hostname override', async ct => {
  setTTY(ct, true)
  sinon.stub(prompts, 'input').resolves('A suggestion')
  const run = sinon.stub(PostFeedback.prototype, 'run').resolves({ ok: true })
  await feedback.call({ opts: () => ({ hostname: 'https://custom.example.com' }) })
  ct.equal(run.firstCall.thisValue.hostname, 'https://custom.example.com')
  ct.equal(run.firstCall.thisValue.body, 'A suggestion')
})

t.test('rejects blank feedback without making a request', async ct => {
  const run = sinon.stub(PostFeedback.prototype, 'run')
  const result = await feedback.call(command, ' \n ')
  ct.equal(result.exitCode, 1)
  ct.notOk(run.called)
})

t.test('missing noninteractive input fails without prompting', async ct => {
  setTTY(ct, false)
  const prompt = sinon.stub(prompts, 'input')
  const run = sinon.stub(PostFeedback.prototype, 'run')
  const result = await feedback.call(command)
  ct.equal(result.exitCode, 1)
  ct.notOk(prompt.called)
  ct.notOk(run.called)
})

t.test('cancellation exits without submitting', async ct => {
  setTTY(ct, true)
  sinon.stub(prompts, 'input').rejects(Object.assign(new Error('prompt cancelled'), { code: 'PROMPT_CANCELLED' }))
  const run = sinon.stub(PostFeedback.prototype, 'run')
  const result = await feedback.call(command)
  ct.equal(result.exitCode, 130)
  ct.notOk(run.called)
})

t.test('request errors fail without a success message', async ct => {
  sinon.stub(Session.prototype, 'hostname').returns('https://example.com')
  sinon.stub(PostFeedback.prototype, 'run').rejects(new Error('Service unavailable'))
  const result = await feedback.call(command, 'A suggestion')
  ct.equal(result.exitCode, 1)
  ct.ok(logger.error.calledWith('Service unavailable'))
  ct.notOk(logger.success.called)
})

t.test('feedback is listed only in the hidden menu', ct => {
  const cli = 'src/cli/dotenvx.js'
  const help = execFileSync(process.execPath, [cli, '--help'], { encoding: 'utf8' })
  const hidden = execFileSync(process.execPath, [cli, 'hidden'], { encoding: 'utf8' })
  const commandHelp = execFileSync(process.execPath, [cli, 'feedback', '--help'], { encoding: 'utf8' })
  ct.notMatch(help, /feedback/)
  ct.match(hidden, /feedback \[message\]/)
  ct.match(commandHelp, /send feedback to dotenvx/)
  ct.end()
})
