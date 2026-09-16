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
