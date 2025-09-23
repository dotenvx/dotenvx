const t = require('tap')
const Run = require('../../../src/lib/services/run')

t.test('encrypted value with wrong private key should not be injected into environment', t => {
  // Set up a wrong private key
  process.env.DOTENV_PRIVATE_KEY = 'wrong-private-key'
  
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/encrypted/.env' }
  ]

  const {
    processedEnvs,
    uniqueInjectedKeys
  } = new Run(envs).run()

  // The encrypted value should fail to decrypt
  t.ok(processedEnvs[0].errors.length > 0, 'should have decryption errors')
  
  // But it should not be injected into the environment 
  t.notOk(processedEnvs[0].injected.HELLO, 'HELLO should not be injected when decryption fails')
  t.notOk(uniqueInjectedKeys.includes('HELLO'), 'HELLO should not be in uniqueInjectedKeys')
  
  // Only the public key should be injected
  t.ok(processedEnvs[0].injected.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should be injected')
  t.ok(uniqueInjectedKeys.includes('DOTENV_PUBLIC_KEY'), 'DOTENV_PUBLIC_KEY should be in uniqueInjectedKeys')

  t.end()
})

t.test('encrypted value with correct private key should be decrypted and injected', t => {
  // Set up the correct private key for the test file
  process.env.DOTENV_PRIVATE_KEY = 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1'
  
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/encrypted/.env' }
  ]

  const {
    processedEnvs,
    uniqueInjectedKeys
  } = new Run(envs).run()

  // Should have no errors
  t.equal(processedEnvs[0].errors.length, 0, 'should have no errors')
  
  // The decrypted value should be injected
  t.equal(processedEnvs[0].injected.HELLO, 'encrypted', 'HELLO should be decrypted and injected')
  t.ok(uniqueInjectedKeys.includes('HELLO'), 'HELLO should be in uniqueInjectedKeys')
  
  // The DOTENV_PUBLIC_KEY should be in parsed but might be in preExisted if already in env
  t.ok(processedEnvs[0].parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should be in parsed')

  t.end()
})