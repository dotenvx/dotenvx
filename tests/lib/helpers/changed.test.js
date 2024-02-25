const t = require('tap')

const encrypt = require('../../../src/lib/helpers/encrypt')
const changed = require('../../../src/lib/helpers/changed')

t.test('#changed (no changes)', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const raw = 'HELLO=World'
  const ciphertext = encrypt(raw, dotenvKey)
  const result = changed(ciphertext, raw, dotenvKey)

  ct.same(result, false)

  ct.end()
})

t.test('#changed (yes changed)', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const raw = 'HELLO=World'
  const ciphertext = encrypt(raw, dotenvKey)
  const result = changed(ciphertext, 'HELLO=Universe', dotenvKey)

  ct.same(result, true)

  ct.end()
})
