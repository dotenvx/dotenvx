const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')

const removeEnvKey = require('../../../src/lib/helpers/removeEnvKey')

t.test('#removeEnvKey removes key from existing .env.keys file', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', '# comment\nDOTENV_PRIVATE_KEY=abc123\nOTHER=value\n', 'utf8')

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, true)
    ct.equal(result.filepath, '.env.keys')
    ct.equal(keysSrc, '# comment\nOTHER=value\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey removes duplicate and export-prefixed entries', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', 'DOTENV_PRIVATE_KEY=one\nOTHER=value\nexport DOTENV_PRIVATE_KEY=two\n', 'utf8')

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, true)
    ct.equal(keysSrc, 'OTHER=value\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey preserves CRLF line endings', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', 'DOTENV_PRIVATE_KEY=one\r\nOTHER=value\r\n', 'utf8')

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, true)
    ct.equal(keysSrc, 'OTHER=value\r\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey does not rewrite file when key is already absent', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', 'OTHER=value\n', 'utf8')
    const beforeStat = fs.statSync(path.join(tmpDir, '.env.keys')).mtimeMs

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const afterStat = fs.statSync(path.join(tmpDir, '.env.keys')).mtimeMs
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, false)
    ct.equal(keysSrc, 'OTHER=value\n')
    ct.equal(afterStat, beforeStat, 'does not rewrite unchanged file')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey leaves an empty .env.keys file unchanged', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', '', 'utf8')

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, false)
    ct.equal(keysSrc, '')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey deletes file when removing the last key', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', 'DOTENV_PRIVATE_KEY=abc123\n', 'utf8')

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const exists = fs.existsSync(path.join(tmpDir, '.env.keys'))

    ct.equal(result.changed, true)
    ct.equal(exists, false)
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey deletes file when only comments remain after removing last key', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', '# comment\nDOTENV_PRIVATE_KEY=abc123\n', 'utf8')

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')
    const exists = fs.existsSync(path.join(tmpDir, '.env.keys'))

    ct.equal(result.changed, true)
    ct.equal(exists, false)
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#removeEnvKey returns unchanged when .env.keys is missing', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-remove-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)

    const result = removeEnvKey('DOTENV_PRIVATE_KEY')

    ct.same(result, {
      changed: false,
      key: 'DOTENV_PRIVATE_KEY',
      filepath: '.env.keys'
    })
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})
