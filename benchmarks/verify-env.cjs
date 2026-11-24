const assert = require('node:assert/strict')
const expected = require('./fixtures/expected.json')

assert.equal(Object.keys(expected).length, 30)
for (const [name, value] of Object.entries(expected)) {
  assert.equal(process.env[name], value, `${name} must decrypt to its expected value`)
}
console.log('Verified all 30 decrypted variables.')
