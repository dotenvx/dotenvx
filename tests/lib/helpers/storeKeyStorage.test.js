const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('back reopens custody and stores the same key in the new destination', async t => {
  const select = sinon.stub()
  select.onFirstCall().resolves('armored')
  select.onSecondCall().resolves('file')
  const store = sinon.stub()
  store.onFirstCall().rejects(Object.assign(new Error('back'), { code: 'KEY_CUSTODY_BACK' }))
  store.onSecondCall().resolves({ keysSrc: 'stored' })
  const storeKeyStorage = proxyquire('../../../src/lib/helpers/storeKeyStorage', {
    './selectKeyStorage': select,
    '../custodians': { store }
  })
  const result = await storeKeyStorage(undefined, 'public', 'private', {}, { token: 'token' })
  t.same(result, { storage: 'file', stored: { keysSrc: 'stored' } })
  t.equal(select.callCount, 2)
  t.same(store.firstCall.args, ['armored', 'public', 'private', { token: 'token', allowCustodyBack: true }])
  t.same(store.secondCall.args, ['file', 'public', 'private', { token: 'token', allowCustodyBack: true }])
})

t.test('storage failures propagate without reopening custody', async t => {
  const select = sinon.stub()
  const error = new Error('access denied')
  const storeKeyStorage = proxyquire('../../../src/lib/helpers/storeKeyStorage', {
    './selectKeyStorage': select,
    '../custodians': { store: sinon.stub().rejects(error) }
  })
  await t.rejects(storeKeyStorage('armored', 'public', 'private', {}, {}), error)
  t.equal(select.callCount, 0)
})
