const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { createRegistry } = require('../../../src/lib/custodians')

function setup (error, teams = ['team-a']) {
  const calls = []
  const select = sinon.stub().resolves('team-b')
  class Session {
    hostname () { return 'https://armor.example.com' }
    token () { return 'token' }
    devicePublicKey () { return 'device' }
  }
  class PostArmorUp {
    constructor (...args) { calls.push(args) }
    async run () { if (error && calls.length === 1) throw error }
  }
  const store = proxyquire('../../../src/lib/custodians/managed/armor/store', {
    '../../../../db/session': Session,
    '../../../api/postArmorUp': PostArmorUp,
    '../../../helpers/prompts': { select }
  })
  if (error && error.code === 'TEAM_REQUIRED') {
    error.meta = { organizations: teams.map(slug => ({ provider_slug: slug })) }
  }
  const armor = proxyquire('../../../src/lib/custodians/managed/armor', { './store': store })
  return { registry: createRegistry([armor]), calls, select }
}

t.test('managed creation stores in Armor without staging file keys', async t => {
  const { registry, calls, select } = setup()
  t.same(await registry.store('armored', 'public', 'private', { keysSrc: 'existing' }), {})
  t.same(calls, [['https://armor.example.com', 'token', 'device', 'public', 'private', undefined]])
  t.equal(select.callCount, 0)
  t.same(await registry.choices(), [], 'not offered in local custody')
  t.same(await registry.choices({}, 'managed'), [{ name: '⛨ Armor', value: 'armored', disabled: false }])
  t.same(registry.providers(), [], 'managed lookup is composed after local providers')
})

t.test('single-team retry does not prompt', async t => {
  const { registry, calls, select } = setup({ code: 'TEAM_REQUIRED' })
  await registry.store('armored', 'public', 'private')
  t.equal(calls.length, 2)
  t.equal(calls[1][5], 'team-a')
  t.equal(select.callCount, 0)
})

t.test('multiple teams prompt and retry with selected team', async t => {
  const { registry, calls, select } = setup({ code: 'TEAM_REQUIRED' }, ['team-a', 'team-b'])
  await registry.store('armored', 'public', 'private')
  t.equal(calls[1][5], 'team-b')
  t.same(select.firstCall.args[0], {
    message: 'Select team',
    choices: [{ name: 'team-a', value: 'team-a' }, { name: 'team-b', value: 'team-b' }]
  })
})

t.test('Armor failures propagate without retry or file fallback', async t => {
  const error = new Error('access denied')
  const { registry, calls, select } = setup(error)
  await t.rejects(registry.store('armored', 'public', 'private'), error)
  t.equal(calls.length, 1)
  t.equal(select.callCount, 0)
})

t.test('Armor configuration preserves explicit token and sync/async session checks', async t => {
  const noArmor = sinon.stub().resolves(true)
  const noArmorSync = sinon.stub().returns(true)
  class Session {
    noArmor () { return noArmor() }
    noArmorSync () { return noArmorSync() }
  }
  const armor = proxyquire('../../../src/lib/custodians/managed/armor', { '../../../../db/session': Session })
  t.equal(armor.enabled({ noArmor: true }), false)
  t.equal(armor.enabled({ armor: false }), false)
  t.equal(await armor.configured({ token: 'explicit' }), true)
  t.equal(armor.configuredSync({ token: 'explicit' }), true)
  t.equal(noArmor.callCount, 0)
  t.equal(noArmorSync.callCount, 0)
  t.equal(await armor.configured(), false)
  t.equal(armor.configuredSync(), false)
  noArmor.resolves(false)
  noArmorSync.returns(false)
  t.equal(await armor.configured(), true)
  t.equal(armor.configuredSync(), true)
})
