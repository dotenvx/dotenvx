const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const sinon = require('sinon')

const fsx = require('../../../src/lib/helpers/fsx')
const init = require('../../../src/lib/services/init')

function enospc () {
  const error = new Error('ENOSPC: no space left on device, write')
  error.code = 'ENOSPC'
  return error
}

function withTmpDir (run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-fsx-'))
  try {
    run(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

t.test('#writeFileXSync replaces existing contents on success', ct => {
  withTmpDir(dir => {
    const target = path.join(dir, 'attributes')
    fs.writeFileSync(target, 'old contents\n', 'utf8')

    fsx.writeFileXSync(target, 'new contents\n')

    ct.equal(fs.readFileSync(target, 'utf8'), 'new contents\n')
  })

  ct.end()
})

t.test('#writeFileXSync leaves original contents intact when the write fails with ENOSPC', ct => {
  withTmpDir(dir => {
    const target = path.join(dir, 'attributes')
    fs.writeFileSync(target, 'original contents\n', 'utf8')

    const stub = sinon.stub(fs, 'writeSync').throws(enospc())
    try {
      ct.throws(() => fsx.writeFileXSync(target, 'replacement contents\n'), { code: 'ENOSPC' })
    } finally {
      stub.restore()
    }

    ct.equal(fs.readFileSync(target, 'utf8'), 'original contents\n')
  })

  ct.end()
})

t.test('#init leaves an existing Envfile intact when the atomic write fails with ENOSPC', ct => {
  withTmpDir(dir => {
    fs.writeFileSync(path.join(dir, 'Envfile'), 'ORIGINAL\n', 'utf8')
    fs.writeFileSync(path.join(dir, '.env.example'), 'HELLO=World\n', 'utf8')

    const stub = sinon.stub(fs, 'writeSync').throws(enospc())
    try {
      ct.throws(() => init({ directory: dir, envFile: '.env.example', overwrite: true }), { code: 'ENOSPC' })
    } finally {
      stub.restore()
    }

    ct.equal(fs.readFileSync(path.join(dir, 'Envfile'), 'utf8'), 'ORIGINAL\n')
  })

  ct.end()
})

t.test('#init respects exclusive creation without overwrite', ct => {
  withTmpDir(dir => {
    fs.writeFileSync(path.join(dir, 'Envfile'), 'ORIGINAL\n', 'utf8')
    fs.writeFileSync(path.join(dir, '.env.example'), 'HELLO=World\n', 'utf8')

    const result = init({ directory: dir, envFile: '.env.example' })

    ct.equal(result.created, false)
    ct.equal(fs.readFileSync(path.join(dir, 'Envfile'), 'utf8'), 'ORIGINAL\n')
  })

  ct.end()
})

t.test('#init creates an Envfile when none exists', ct => {
  withTmpDir(dir => {
    fs.writeFileSync(path.join(dir, '.env.example'), 'HELLO=World\n', 'utf8')

    const result = init({ directory: dir, envFile: '.env.example' })

    ct.equal(result.created, true)
    ct.ok(fs.existsSync(path.join(dir, 'Envfile')))
  })

  ct.end()
})
