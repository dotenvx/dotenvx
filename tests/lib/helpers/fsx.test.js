const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const sinon = require('sinon')

const fsx = require('../../../src/lib/helpers/fsx')

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

t.test('#writeFileXSync still follows symlinks by default', { skip: process.platform === 'win32' }, ct => {
  withTmpDir(dir => {
    const target = path.join(dir, 'target')
    const link = path.join(dir, 'link')
    fs.writeFileSync(target, 'ORIGINAL\n')
    fs.symlinkSync(target, link)
    fsx.writeFileXSync(link, 'UPDATED\n')
    ct.ok(fs.lstatSync(link).isSymbolicLink())
    ct.equal(fs.readFileSync(target, 'utf8'), 'UPDATED\n')
  })
  ct.end()
})
