const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('select uses enquirer with normalized choices and IO context', async ct => {
  const prompt = sinon.stub().resolves({ value: 'local' })

  function EnquirerMock () {
    this.prompt = prompt
  }

  const prompts = proxyquire('../../../src/lib/helpers/prompts', {
    enquirer: EnquirerMock
  })

  const input = {}
  const output = {}
  const value = await prompts.select({
    message: 'Select key storage',
    choices: [
      'raw',
      { name: 'Local (.env.keys)', value: 'local' },
      { value: 'armored' }
    ]
  }, { input, output })

  ct.equal(value, 'local')
  ct.same(prompt.firstCall.args[0], {
    type: 'select',
    name: 'value',
    message: 'Select key storage',
    choices: [
      'raw',
      { name: 'local', message: 'Local (.env.keys)' },
      { name: 'armored', message: 'armored' }
    ],
    stdin: input,
    stdout: output
  })

  ct.end()
})

t.test('select does not require IO context', async ct => {
  const prompt = sinon.stub().resolves({ value: 'armored' })

  function EnquirerMock () {
    this.prompt = prompt
  }

  const prompts = proxyquire('../../../src/lib/helpers/prompts', {
    enquirer: EnquirerMock
  })

  const value = await prompts.select({
    message: 'Select key storage',
    choices: ['local']
  })

  ct.equal(value, 'armored')
  ct.same(prompt.firstCall.args[0], {
    type: 'select',
    name: 'value',
    message: 'Select key storage',
    choices: ['local'],
    stdout: process.stderr
  })

  ct.end()
})
