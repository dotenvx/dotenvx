const t = require('tap')
const proxyquire = require('proxyquire').noCallThru()

t.test('#gpgAvailable', ct => {
  ct.test('returns available=true when gpg is installed', ct => {
    const gpgAvailable = proxyquire('../../../src/lib/helpers/gpgAvailable', {
      child_process: {
        execSync: () => 'gpg (GnuPG) 2.4.0\nlibgcrypt 1.10.1\n'
      }
    })

    const result = gpgAvailable()

    ct.equal(result.available, true)
    ct.equal(result.version, '2.4.0')
    ct.equal(result.error, null)
    ct.equal(result.bin, 'gpg')
    ct.end()
  })

  ct.test('returns available=true with gpg2 when gpg not found', ct => {
    let callCount = 0
    const gpgAvailable = proxyquire('../../../src/lib/helpers/gpgAvailable', {
      child_process: {
        execSync: (cmd) => {
          callCount++
          if (callCount === 1) {
            throw new Error('command not found')
          }
          return 'gpg (GnuPG) 2.2.19\n'
        }
      }
    })

    const result = gpgAvailable()

    ct.equal(result.available, true)
    ct.equal(result.version, '2.2.19')
    ct.equal(result.error, null)
    ct.equal(result.bin, 'gpg2')
    ct.end()
  })

  ct.test('returns available=false when neither gpg nor gpg2 installed', ct => {
    const gpgAvailable = proxyquire('../../../src/lib/helpers/gpgAvailable', {
      child_process: {
        execSync: () => {
          throw new Error('command not found')
        }
      }
    })

    const result = gpgAvailable()

    ct.equal(result.available, false)
    ct.equal(result.version, null)
    ct.ok(result.error.includes('gpg not found'))
    ct.equal(result.bin, null)
    ct.end()
  })

  ct.test('returns version=unknown when version string cannot be parsed', ct => {
    const gpgAvailable = proxyquire('../../../src/lib/helpers/gpgAvailable', {
      child_process: {
        execSync: () => 'some unknown gpg output'
      }
    })

    const result = gpgAvailable()

    ct.equal(result.available, true)
    ct.equal(result.version, 'unknown')
    ct.equal(result.error, null)
    ct.equal(result.bin, 'gpg')
    ct.end()
  })

  ct.end()
})
