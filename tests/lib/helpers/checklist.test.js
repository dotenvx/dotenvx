const t = require('tap')
const { PassThrough } = require('stream')
const Checklist = require('../../../src/lib/helpers/checklist')

async function setup (ct) {
  const input = new PassThrough()
  input.isTTY = true
  input.setRawMode = () => {}
  const output = new PassThrough()
  const prompt = new Checklist({
    message: 'Choose protections',
    submitLabel: 'Install protections',
    choices: [{ name: 'filter', message: 'Secrets' }, { name: 'ignore', message: 'Private keys' }],
    initial: ['filter', 'ignore'],
    stdin: input,
    stdout: output
  })
  ct.teardown(() => { prompt.close(); input.destroy(); output.destroy() })
  await prompt.initialize()
  return prompt
}

t.test('Enter toggles checkboxes; only the install row submits', async ct => {
  const prompt = await setup(ct)
  ct.same(prompt.selected.map(choice => choice.name), ['filter', 'ignore'])
  ct.match(prompt.indicator(prompt.focused), '●')
  await prompt.submit()
  ct.notOk(prompt.state.submitted)
  ct.match(prompt.indicator(prompt.focused), '○')
  ct.same(prompt.selected.map(choice => choice.name), ['ignore'])
  await prompt.submit()
  ct.same(prompt.selected.map(choice => choice.name), ['filter', 'ignore'])
  await prompt.down()
  await prompt.space()
  ct.same(prompt.selected.map(choice => choice.name), ['filter'])
  await prompt.down()
  ct.equal(prompt.focused.message, 'Install protections')
  ct.equal(prompt.indicator(prompt.focused), ' ')
  await prompt.space()
  ct.notOk(prompt.state.submitted)
  await prompt.submit()
  ct.ok(prompt.state.submitted)
  ct.same(prompt.value, ['filter'])
  ct.match(prompt.format(), 'Secrets')
})

t.test('install with no selections returns an empty list', async ct => {
  const prompt = await setup(ct)
  await prompt.submit()
  await prompt.down()
  await prompt.submit()
  await prompt.down()
  await prompt.submit()
  ct.same(prompt.value, [])
})

t.test('bulk toggles never include the install action in the result', async ct => {
  const prompt = await setup(ct)
  await prompt.a()
  await prompt.i()
  await prompt.i()
  await prompt.down()
  await prompt.down()
  await prompt.submit()
  ct.same(prompt.value, ['filter', 'ignore'])
})

t.test('action label follows selections', async ct => {
  const prompt = await setup(ct)
  prompt.options.submitLabel = selected => selected.length ? 'Apply changes' : 'Remove protections'
  const action = prompt.choices.find(choice => choice.action)
  ct.match(await prompt.renderChoice(action, 2), 'Apply changes')
  await prompt.submit()
  await prompt.down()
  await prompt.submit()
  ct.match(await prompt.renderChoice(action, 2), 'Remove protections')
})
