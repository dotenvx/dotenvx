const t = require('tap')

const truncate = require('../../../src/lib/helpers/truncate')

t.test('#truncate', ct => {
  const privateKey = '2c93601cba85b3b2474817897826ebef977415c097f0bf57dcbaa3056e5d64d0'

  const result = truncate(privateKey)

  t.equal(result, '2c93601…')

  ct.end()
})

t.test('#truncate - 11 characters', ct => {
  const privateKey = 'dxo_123456789'

  const result = truncate(privateKey, 11)

  t.equal(result, 'dxo_1234567…')

  ct.end()
})
