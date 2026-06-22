const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')

const Keypair2 = require('../../../src/lib/services/keypair2')

const publicKey = '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba'

t.test('#runSync fills missing private key through armor provider', ct => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-keypair2-'))
  const envFile = path.join(dir, '.env')

  try {
    fs.writeFileSync(envFile, `DOTENV_PUBLIC_KEY="${publicKey}"\nHELLO=World\n`)

    const result = new Keypair2(envFile).runSync()

    ct.same(result, {
      DOTENV_PUBLIC_KEY: publicKey,
      DOTENV_PRIVATE_KEY: 'todo'
    })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }

  ct.end()
})
