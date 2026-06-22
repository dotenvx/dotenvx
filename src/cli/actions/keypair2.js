const Keypair2 = require('./../../lib/services/keypair2')

async function keypair2 (key) {
  const options = this.opts()
  const prettyPrint = options.prettyPrint || options.pp
  const keypairs = await new Keypair2(options.envFile, options.envKeysFile).run()
  const results = key ? keypairs[key] : keypairs

  if (typeof results === 'object' && results !== null) {
    if (options.format === 'shell') {
      let inline = ''
      for (const [keyName, value] of Object.entries(results)) {
        inline += `${keyName}=${value || ''} `
      }
      inline = inline.trim()

      console.log(inline)
    } else if (options.format === 'colon') {
      let inline = ''
      for (const [keyName, value] of Object.entries(results)) {
        inline += `${keyName}:${value || ''} `
      }
      inline = inline.trim()

      console.log(inline)
    } else {
      let space = 0
      if (prettyPrint) {
        space = 2
      }

      console.log(JSON.stringify(results, null, space))
    }
  } else {
    if (results === undefined) {
      console.log('')
      process.exit(1)
    } else if (options.format === 'colon' && key) {
      console.log(`${key}:${results}`)
    } else {
      console.log(results)
    }
  }
}

module.exports = keypair2
