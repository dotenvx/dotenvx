const t = require('tap')
const path = require('path')
const { spawnSync } = require('child_process')

const cli = path.resolve(__dirname, '../../../src/cli/dotenvx.js')
function packet (value) {
  if (value === null) return Buffer.from('0000')
  const bytes = Buffer.from(value)
  return Buffer.concat([Buffer.from((bytes.length + 4).toString(16).padStart(4, '0')), bytes])
}
const hello = ['git-filter-client\n', 'version=2\n', null, 'capability=clean\n', null]
const reply = ['git-filter-server\n', 'version=2\n', null, 'capability=clean\n', null]
const encode = values => Buffer.concat(values.map(packet))
const request = (name, content) => ['command=clean\n', `pathname=${name}\n`, null, content, null]
const run = input => spawnSync(process.execPath, [cli, 'protect', '--git-process'], { input, timeout: 5000 })

t.test('multiple requests, rejection, empty and binary exempt contents', ct => {
  const binary = Buffer.from([0, 255, 13, 10, 128])
  const result = run(encode([...hello,
    ...request('.env', 'SECRET=do-not-leak\n'),
    ...request('.env.production', 'SECRET=encrypted:example\r\n'),
    ...request('.env.example', binary),
    ...request('.env.empty', ''),
    ...request('.env.keys', 'DOTENV_PRIVATE_KEY=do-not-leak\n')
  ]))
  ct.equal(result.status, 0)
  ct.same(result.stdout, encode([...reply,
    'status=error\n', null,
    'status=success\n', null, 'SECRET=encrypted:example\r\n', null, null,
    'status=success\n', null, binary, null, null,
    'status=success\n', null, null, null,
    'status=error\n', null
  ]))
  ct.match(result.stderr.toString(), 'contains plaintext secrets')
  ct.notMatch(result.stderr.toString(), 'do-not-leak')
  ct.notMatch(result.stdout.toString(), 'do-not-leak')
  ct.end()
})

t.test('multi-packet content is returned unchanged', ct => {
  const chunk = '#'.repeat(65516)
  const result = run(encode([...hello, 'command=clean\n', 'pathname=.env\n', null, chunk, chunk, null]))
  ct.equal(result.status, 0)
  ct.same(result.stdout, encode([...reply, 'status=success\n', null, chunk, chunk, null, null]))
  ct.end()
})

t.test('checkout passes existing plaintext through without applying add protection', ct => {
  const result = run(encode([
    'git-filter-client\n', 'version=2\n', null, 'capability=clean\n', 'capability=smudge\n', null,
    'command=smudge\n', 'pathname=.env\n', null, 'EXISTING=plaintext\n', null
  ]))
  ct.equal(result.status, 0)
  ct.same(result.stdout, encode([
    'git-filter-server\n', 'version=2\n', null, 'capability=clean\n', 'capability=smudge\n', null,
    'status=success\n', null, 'EXISTING=plaintext\n', null, null
  ]))
  ct.equal(result.stderr.length, 0)
  ct.end()
})

for (const input of [Buffer.from('oopssecret'), Buffer.from('000'), encode(['git-filter-client\n', 'version=1\n', null]), encode([...hello, 'command=clean\n', null])]) {
  t.test('invalid or truncated protocol fails closed without leaking input', ct => {
    const result = run(input)
    ct.equal(result.status, 1)
    ct.match(result.stderr.toString(), 'Git protection filter protocol failed')
    ct.notMatch(result.stderr.toString(), 'oopssecret')
    ct.end()
  })
}
