const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')

const readFileKey = require('../../../../src/lib/helpers/keyResolution/readFileKey')

t.test('#readFileKey returns value when key exists and non-empty', async ct => {
  const filepath = 'tests/monorepo/apps/encrypted/.env.keys'
  const result = await readFileKey('DOTENV_PRIVATE_KEY', filepath)

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')
  ct.end()
})

t.test('#readFileKey returns undefined when key exists but empty', async ct => {
  const filepath = path.join(os.tmpdir(), `dotenvx-readFileKey-${Date.now()}.keys`)
  fs.writeFileSync(filepath, 'DOTENV_PRIVATE_KEY=\n', 'utf8')
  const result = await readFileKey('DOTENV_PRIVATE_KEY', filepath)
  fs.unlinkSync(filepath)

  ct.same(result, undefined)
  ct.end()
})

t.test('#readFileKey returns undefined when key does not exist', async ct => {
  const filepath = 'tests/monorepo/apps/encrypted/.env.keys'
  const result = await readFileKey('DOES_NOT_EXIST', filepath)

  ct.same(result, undefined)
  ct.end()
})

t.test('#readFileKey returns undefined when file does not exist', async ct => {
  const result = await readFileKey('DOTENV_PRIVATE_KEY', 'tests/monorepo/apps/encrypted/.missing.keys')

  ct.same(result, undefined)
  ct.end()
})
