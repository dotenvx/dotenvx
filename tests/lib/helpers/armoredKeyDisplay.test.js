const t = require('tap')

const armoredKeyDisplay = require('../../../src/lib/helpers/armoredKeyDisplay')

t.test('armoredKeyDisplay formats first six public key characters', ct => {
  ct.equal(armoredKeyDisplay('027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71'), '027 C9C')
  ct.equal(armoredKeyDisplay('abcdef'), 'ABC DEF')
  ct.equal(armoredKeyDisplay('abc'), 'ABC')
  ct.equal(armoredKeyDisplay(''), '')
  ct.end()
})
