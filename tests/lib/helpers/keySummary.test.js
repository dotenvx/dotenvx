const t = require('tap')
const { keypair } = require('@dotenvx/primitives')
const summary = require('../../../src/lib/helpers/keySummary')
const a = keypair().publicKey
const b = keypair().publicKey
const row = (filepath, key, source) => ({ filepath, src: `DOTENV_PUBLIC_KEY=${key}`, keySources: { [key]: source } })

t.test('maps each file to its key and deduplicates sources in file order', t => {
  const result = summary(['.env', '.env.production', '.env.test'], [row('.env', a, 'macosKeychain'), row('.env.production', b, 'armor'), row('.env.test', a, 'macosKeychain')])
  t.same(result.files, [`.env (${a.slice(0, 3).toUpperCase()} ${a.slice(3, 6).toUpperCase()})`, `.env.production (${b.slice(0, 3).toUpperCase()} ${b.slice(3, 6).toUpperCase()})`, `.env.test (${a.slice(0, 3).toUpperCase()} ${a.slice(3, 6).toUpperCase()})`])
  t.equal(result.suffix, ' via Keychain ⛉,Armor ⛨')
  t.end()
})

t.test('plaintext stays clean and unresolved custody is explicit', t => {
  t.same(summary(['.env'], [{ filepath: '.env', src: 'HELLO=World' }]), { files: ['.env'], suffix: '' })
  t.equal(summary(['.env'], [row('.env', a, null)]).suffix, ' via source unknown')
  t.end()
})
