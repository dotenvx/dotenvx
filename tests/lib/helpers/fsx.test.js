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

t.test('#init overwrite rejects existing symlinks', { skip: process.platform === 'win32' }, ct => {
  withTmpDir(dir => {
    const other = path.join(dir, 'other')
    fs.writeFileSync(other, 'KEEP\n')
    fs.symlinkSync(other, path.join(dir, 'Envfile'))
    ct.throws(() => init({ directory: dir, overwrite: true }), /expected a regular file/)
    ct.equal(fs.readFileSync(other, 'utf8'), 'KEEP\n')
  })
  ct.end()
})

t.test('#init overwrite never follows a symlink introduced during the atomic write', { skip: process.platform === 'win32' }, ct => {
  for (const initiallyExists of [true, false]) {
    withTmpDir(dir => {
      const target = path.join(dir, 'Envfile')
      const other = path.join(dir, 'other')
      if (initiallyExists) fs.writeFileSync(target, 'ORIGINAL\n')
      fs.writeFileSync(other, 'KEEP\n')
      fs.writeFileSync(path.join(dir, '.env'), 'HELLO=World\n')
      const realpath = fs.realpathSync
      let swapped = false
      const stub = sinon.stub(fs, 'realpathSync').callsFake(function (filename, ...args) {
        if (!swapped) {
          swapped = true
          if (initiallyExists) fs.unlinkSync(target)
          fs.symlinkSync(other, target)
        }
        return realpath.call(fs, filename, ...args)
      })
      try {
        ct.throws(() => init({ directory: dir, overwrite: true }), /expected a regular file/)
      } finally {
        stub.restore()
      }
      ct.ok(swapped, 'swaps the destination when the atomic library resolves its path')
      ct.equal(fs.readFileSync(other, 'utf8'), 'KEEP\n', 'symlink target is untouched')
      ct.same(fs.readdirSync(dir).filter(name => name.startsWith('.dotenvx-write-')), [], 'staging is cleaned up')
    })
  }
  ct.end()
})

t.test('#init overwrite cannot follow a symlink swapped immediately before the final rename', { skip: process.platform === 'win32' }, ct => {
  withTmpDir(dir => {
    const target = path.join(dir, 'Envfile')
    const other = path.join(dir, 'other')
    fs.writeFileSync(target, 'ORIGINAL\n')
    fs.writeFileSync(other, 'KEEP\n')
    fs.writeFileSync(path.join(dir, '.env'), 'HELLO=World\n')
    const rename = fs.renameSync
    let swapped = false
    const stub = sinon.stub(fs, 'renameSync').callsFake((from, to) => {
      if (to === target) {
        swapped = true
        fs.unlinkSync(target)
        fs.symlinkSync(other, target)
      }
      return rename.call(fs, from, to)
    })
    try {
      ct.equal(init({ directory: dir, overwrite: true }).created, true)
    } finally {
      stub.restore()
    }
    ct.ok(swapped)
    ct.equal(fs.readFileSync(other, 'utf8'), 'KEEP\n')
    ct.ok(fs.lstatSync(target).isFile(), 'rename replaces the link itself')
    ct.match(fs.readFileSync(target, 'utf8'), 'HELLO')
  })
  ct.end()
})

t.test('#init atomic overwrite preserves permissions and cleans staging after failure', ct => {
  withTmpDir(dir => {
    const target = path.join(dir, 'Envfile')
    fs.writeFileSync(target, 'ORIGINAL\n', { mode: 0o600 })
    fs.writeFileSync(path.join(dir, '.env'), 'HELLO=World\n')
    ct.equal(init({ directory: dir, overwrite: true }).created, true)
    if (process.platform !== 'win32') ct.equal(fs.statSync(target).mode & 0o777, 0o600)
    const source = fs.readFileSync(target, 'utf8')
    const stub = sinon.stub(fs, 'writeSync').throws(enospc())
    try {
      ct.throws(() => init({ directory: dir, overwrite: true }), { code: 'ENOSPC' })
    } finally {
      stub.restore()
    }
    ct.equal(fs.readFileSync(target, 'utf8'), source)
    ct.same(fs.readdirSync(dir).filter(name => name.startsWith('.dotenvx-write-')), [])
  })
  ct.end()
})

t.test('#init overwrite creates a missing Envfile atomically', ct => {
  withTmpDir(dir => {
    fs.writeFileSync(path.join(dir, '.env'), 'HELLO=World\n')
    ct.equal(init({ directory: dir, overwrite: true }).created, true)
    ct.match(fs.readFileSync(path.join(dir, 'Envfile'), 'utf8'), 'HELLO')
    ct.same(fs.readdirSync(dir).sort(), ['.env', 'Envfile'])
  })
  ct.end()
})

t.test('#init preserves the original when the final rename fails', ct => {
  withTmpDir(dir => {
    const target = path.join(dir, 'Envfile')
    fs.writeFileSync(target, 'ORIGINAL\n')
    const rename = fs.renameSync
    const stub = sinon.stub(fs, 'renameSync').callsFake((from, to) => {
      if (to === target) throw enospc()
      return rename.call(fs, from, to)
    })
    try {
      ct.throws(() => init({ directory: dir, overwrite: true }), { code: 'ENOSPC' })
    } finally {
      stub.restore()
    }
    ct.equal(fs.readFileSync(target, 'utf8'), 'ORIGINAL\n')
    ct.same(fs.readdirSync(dir), ['Envfile'])
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
