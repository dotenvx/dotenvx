const sinon = require('sinon')
const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.test('decrypts', ct => {
  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const keyStr = 'ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00'

  const result = dotenvx.decrypt(encrypted, keyStr)

  ct.equal(result, '# development@v6\nALPHA="zeta"')

  ct.end()
})

t.test('invalid key', ct => {
  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const keyStr = 'badstring'

  try {
    dotenvx.decrypt(encrypted, keyStr)

    ct.fail('decrypt here should throw error')
  } catch (error) {
    ct.pass(' threw an error')
    ct.equal(error.message, 'INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
  }

  ct.end()
})

t.test('incorrect key', ct => {
  // Stub process.exit
  const exitStub = sinon.stub(process, 'exit')

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const keyStr = 'aacaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00'

  dotenvx.decrypt(encrypted, keyStr)

  t.ok(exitStub.calledWith(1), 'process.exit(1) should be called')

  exitStub.restore()

  ct.end()
})
