const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

function setup (ct, answers, availability = {}) {
  const select = sinon.stub()
  answers.forEach((answer, index) => select.onCall(index).resolves(answer))
  const onepassword = sinon.stub().resolves(availability.onepassword || false)
  const bitwarden = sinon.stub().resolves(availability.bitwarden || false)
  const custodians = proxyquire('../../../src/lib/custodians', {
    './local/onepassword': { available: onepassword },
    './local/bitwarden': { available: bitwarden }
  })
  const picker = proxyquire('../../../src/lib/helpers/selectKeyStorage', {
    './prompts': { select },
    '../custodians': custodians
  })
  for (const stream of [process.stdin, process.stderr]) {
    const descriptor = Object.getOwnPropertyDescriptor(stream, 'isTTY')
    Object.defineProperty(stream, 'isTTY', { configurable: true, value: true })
    ct.teardown(() => {
      if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
      else delete stream.isTTY
    })
  }
  for (const key of ['CI', 'DOTENVX_NO_NATIVE', 'DOTENVX_NO_1PASSWORD', 'DOTENVX_NO_BITWARDEN']) {
    const original = process.env[key]
    delete process.env[key]
    ct.teardown(() => {
      if (original === undefined) delete process.env[key]
      else process.env[key] = original
    })
  }
  return { picker, select, onepassword, bitwarden }
}

t.test('local custody lists all stores and disables unavailable choices', async ct => {
  const { picker, select } = setup(ct, ['local', 'onepassword'], { onepassword: true })
  ct.equal(await picker({ noNative: true }), 'onepassword')
  ct.same(select.firstCall.args[0].choices, [
    { name: '⛉ Local Custody', value: 'local', disabled: false },
    { name: '⛊ Managed Custody', value: 'managed' }
  ])
  const choices = select.secondCall.args[0].choices
  ct.same(choices.map(({ value, disabled }) => ({ value, disabled })), [
    { value: 'native', disabled: true },
    { value: 'onepassword', disabled: false },
    { value: 'bitwarden', disabled: true },
    { value: 'file', disabled: false }
  ])
  ct.match(choices[0].name, /^OS/)
})

t.test('managed custody opens an Armor submenu', async ct => {
  const { picker, select } = setup(ct, ['managed', 'armored'])
  ct.equal(await picker(), 'armored')
  ct.same(select.secondCall.args[0], {
    message: 'Choose managed custody',
    choices: [{ name: '⛨ Armor', value: 'armored' }]
  })
})

t.test('Armor unavailable hides managed custody but still opens local submenu', async ct => {
  const { picker, select } = setup(ct, ['local', 'bitwarden'], { bitwarden: true })
  ct.equal(await picker({ noArmor: true, noNative: true }), 'bitwarden')
  ct.same(select.firstCall.args[0].choices, [{ name: '⛉ Local Custody', value: 'local', disabled: false }])
  ct.equal(select.secondCall.args[0].choices[2].disabled, false)
})

t.test('explicit opt-outs disable installed stores without probing them', async ct => {
  const { picker, select, onepassword, bitwarden } = setup(ct, ['local', 'file'], { onepassword: true, bitwarden: true })
  await picker({ noNative: true, no1Password: true, noBitwarden: true })
  ct.equal(select.firstCall.args[0].choices[0].disabled, false)
  ct.same(select.secondCall.args[0].choices.map(choice => choice.disabled), [true, true, true, false])
  ct.equal(onepassword.callCount, 0)
  ct.equal(bitwarden.callCount, 0)
})

t.test('file remains selectable last when other stores are unavailable', async ct => {
  const { picker, select } = setup(ct, ['local', 'file'])
  ct.equal(await picker({ noNative: true, noArmor: true }), 'file')
  ct.equal(select.callCount, 2)
  ct.same(select.secondCall.args[0].choices[3], { name: 'File (.env.keys)', value: 'file', disabled: false })
})

t.test('noninteractive use preserves defaults and does not probe stores', async ct => {
  const { picker, select, onepassword, bitwarden } = setup(ct, [])
  ct.equal(await picker({ noCreate: true, noNative: true }), 'file')
  ct.equal(select.callCount, 0)
  ct.equal(onepassword.callCount, 0)
  ct.equal(bitwarden.callCount, 0)
})
