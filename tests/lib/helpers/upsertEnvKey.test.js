const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')

const upsertEnvKey = require('../../../src/lib/helpers/upsertEnvKey')

t.test('#upsertEnvKey creates .env.keys when missing', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-upsert-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    const result = upsertEnvKey('DOTENV_PRIVATE_KEY', 'abc123')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, true)
    ct.equal(result.created, true)
    ct.equal(result.filepath, '.env.keys')
    ct.equal(keysSrc, 'DOTENV_PRIVATE_KEY=abc123\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#upsertEnvKey appends key when missing from existing file', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-upsert-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', '# comments stay\nEXISTING=1\n', 'utf8')

    const result = upsertEnvKey('DOTENV_PRIVATE_KEY_PRODUCTION', 'prod123')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, true)
    ct.equal(result.created, false)
    ct.equal(keysSrc, '# comments stay\nEXISTING=1\nDOTENV_PRIVATE_KEY_PRODUCTION=prod123\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#upsertEnvKey does not rewrite file when value is already current', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-upsert-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', 'DOTENV_PRIVATE_KEY=samevalue\n', 'utf8')
    const beforeStat = fs.statSync(path.join(tmpDir, '.env.keys')).mtimeMs

    const result = upsertEnvKey('DOTENV_PRIVATE_KEY', 'samevalue')
    const afterStat = fs.statSync(path.join(tmpDir, '.env.keys')).mtimeMs
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(result.changed, false)
    ct.equal(result.created, false)
    ct.equal(keysSrc, 'DOTENV_PRIVATE_KEY=samevalue\n')
    ct.equal(afterStat, beforeStat, 'does not rewrite unchanged file')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#upsertEnvKey replaces existing values, removes duplicates, and avoids quotes', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-upsert-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync(
      '.env.keys',
      [
        '# .env',
        'DOTENV_PRIVATE_KEY="old-quoted"',
        'OTHER=value',
        'export DOTENV_PRIVATE_KEY=old-unquoted',
        ''
      ].join('\n'),
      'utf8'
    )

    upsertEnvKey('DOTENV_PRIVATE_KEY', 'newvalue')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(keysSrc, '# .env\nDOTENV_PRIVATE_KEY=newvalue\nOTHER=value\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})

t.test('#upsertEnvKey preserves CRLF line endings', ct => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-ops-upsert-'))
  const oldCwd = process.cwd()

  try {
    process.chdir(tmpDir)
    fs.writeFileSync('.env.keys', 'OTHER=value\r\n', 'utf8')

    upsertEnvKey('DOTENV_PRIVATE_KEY', 'abc123')
    const keysSrc = fs.readFileSync(path.join(tmpDir, '.env.keys'), 'utf8')

    ct.equal(keysSrc, 'OTHER=value\r\nDOTENV_PRIVATE_KEY=abc123\r\n')
  } finally {
    process.chdir(oldCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  ct.end()
})
