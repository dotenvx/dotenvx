const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')

const readEnvFileKey = require('../../../../src/lib/helpers/keyResolution/readEnvFileKey')

t.test('#readEnvFileKey returns value when key exists and non-empty', ct => {
  const filepath = 'tests/monorepo/apps/encrypted/.env.keys'
  const result = readEnvFileKey('DOTENV_PRIVATE_KEY', filepath)

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')
  ct.end()
})

t.test('#readEnvFileKey returns undefined when key exists but empty', ct => {
  const filepath = path.join(os.tmpdir(), `dotenvx-readEnvFileKey-${Date.now()}.keys`)
  fs.writeFileSync(filepath, 'DOTENV_PRIVATE_KEY=\n', 'utf8')
  const result = readEnvFileKey('DOTENV_PRIVATE_KEY', filepath)
  fs.unlinkSync(filepath)

  ct.same(result, undefined)
  ct.end()
})

t.test('#readEnvFileKey returns undefined when key does not exist', ct => {
  const filepath = 'tests/monorepo/apps/encrypted/.env.keys'
  const result = readEnvFileKey('DOES_NOT_EXIST', filepath)

  ct.same(result, undefined)
  ct.end()
})

t.test('#readEnvFileKey returns undefined when file does not exist', ct => {
  const result = readEnvFileKey('DOTENV_PRIVATE_KEY', 'tests/monorepo/apps/encrypted/.missing.keys')

  ct.same(result, undefined)
  ct.end()
})
