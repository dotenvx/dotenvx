const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const tooling = require('@dotenvx/tooling')

t.test('select uses enquirer with normalized choices and IO context', async ct => {
  const prompt = sinon.stub().resolves({ value: 'file' })

  function EnquirerMock () {
    this.prompt = prompt
  }

  const prompts = proxyquire('../../../src/lib/helpers/prompts', {
    '@dotenvx/tooling': { ...tooling, Enquirer: EnquirerMock }
  })

  const input = {}
  const output = {}
  const value = await prompts.select({
    message: 'Choose private key storage',
    choices: [
      'raw',
      { name: '◫ File (.env.keys)', value: 'file' },
      { value: 'armored', disabled: true }
    ]
  }, { input, output })

  ct.equal(value, 'file')
  ct.same(prompt.firstCall.args[0], {
    type: 'select',
    name: 'value',
    message: 'Choose private key storage',
    choices: [
      'raw',
      { name: 'file', message: '◫ File (.env.keys)' },
      { name: 'armored', message: 'armored', disabled: '(unavailable)' }
    ],
    stdin: input,
    stdout: output
  })

  ct.end()
})

t.test('select does not require IO context', async ct => {
  const prompt = sinon.stub().resolves({ value: 'armored', disabled: true })

  function EnquirerMock () {
    this.prompt = prompt
  }

  const prompts = proxyquire('../../../src/lib/helpers/prompts', {
    '@dotenvx/tooling': { ...tooling, Enquirer: EnquirerMock }
  })

  const value = await prompts.select({
    message: 'Choose private key storage',
    choices: ['local']
  })

  ct.equal(value, 'armored')
  ct.same(prompt.firstCall.args[0], {
    type: 'select',
    name: 'value',
    message: 'Choose private key storage',
    choices: ['local'],
    stdout: process.stderr
  })

  ct.end()
})

t.test('multiselect normalizes choices, preserves defaults and supports cancellation', async ct => {
  const prompt = sinon.stub().resolves({ value: ['filter', 'ignore'] })
  function EnquirerMock () { this.prompt = prompt }
  const prompts = proxyquire('../../../src/lib/helpers/prompts', {
    '@dotenvx/tooling': { ...tooling, Enquirer: EnquirerMock }
  })
  const input = {}
  const output = {}
  const options = {
    message: 'Choose protections',
    choices: [{ name: 'Secrets', value: 'filter' }, { name: 'Private keys', value: 'ignore' }],
    initial: ['filter', 'ignore']
  }
  ct.same(await prompts.multiselect(options, { input, output }), ['filter', 'ignore'])
  ct.same(prompt.firstCall.args[0], {
    type: 'multiselect',
    name: 'value',
    message: options.message,
    choices: [{ name: 'filter', message: 'Secrets' }, { name: 'ignore', message: 'Private keys' }],
    initial: ['filter', 'ignore'],
    stdin: input,
    stdout: output
  })
  prompt.resolves({ value: [] })
  ct.same(await prompts.multiselect({ message: 'Choose', choices: [] }), [])
  ct.same(prompt.lastCall.args[0].initial, [])
  ct.equal(prompt.lastCall.args[0].stdout, process.stderr)
  prompt.rejects(new Error('cancelled'))
  await ct.rejects(prompts.multiselect(options), { code: 'PROMPT_CANCELLED' })
})

t.test('multiselect with a submit label uses the checklist and normalizes cancellation', async ct => {
  const run = sinon.stub().resolves(['filter'])
  let options
  class ChecklistMock {
    constructor (value) { options = value }
    run () { return run() }
  }
  const prompts = proxyquire('../../../src/lib/helpers/prompts', { './checklist': ChecklistMock })
  const request = { message: 'Choose protections', choices: ['filter'], initial: ['filter'], submitLabel: 'Install protections' }
  ct.same(await prompts.multiselect(request), ['filter'])
  ct.equal(options.submitLabel, 'Install protections')
  ct.same(options.initial, ['filter'])
  ct.equal(options.stdout, process.stderr)
  run.rejects(new Error('cancelled'))
  await ct.rejects(prompts.multiselect(request), { code: 'PROMPT_CANCELLED' })
})

t.test('confirm defaults to false and sends input/output context to Enquirer', async ct => {
  const prompt = sinon.stub().resolves({ value: false })
  function EnquirerMock () { this.prompt = prompt }
  const prompts = proxyquire('../../../src/lib/helpers/prompts', {
    '@dotenvx/tooling': { ...tooling, Enquirer: EnquirerMock }
  })
  const input = {}
  const output = {}
  ct.equal(await prompts.confirm({ message: 'Add a password lock?' }, { input, output }), false)
  ct.same(prompt.firstCall.args[0], {
    type: 'confirm', name: 'value', message: 'Add a password lock?', initial: false, stdin: input, stdout: output
  })
  prompt.resolves({ value: true })
  ct.equal(await prompts.confirm({ message: 'Add a password lock?' }), true)
  prompt.rejects(new Error('cancelled'))
  await ct.rejects(prompts.confirm({ message: 'Add a password lock?' }), { code: 'PROMPT_CANCELLED' })
})
