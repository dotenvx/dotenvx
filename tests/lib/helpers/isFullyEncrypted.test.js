const t = require('tap')
const isFullyEncrypted = require('../../../src/lib/helpers/isFullyEncrypted')

t.test('#isFullyEncrypted - All values are encrypted', ct => {
  const str = `
    # .env
    HELLO=encrypted:1234
  `.trim()

  const result = isFullyEncrypted(str)
  ct.same(result, true, 'All values are encrypted')
  ct.end()
})

t.test('#isFullyEncrypted - No values are encrypted', ct => {
  const str = `
    # .env
    HELLO=World
  `.trim()

  const result = isFullyEncrypted(str)
  ct.same(result, false, 'No values are encrypted')
  ct.end()
})

t.test('#isFullyEncrypted - partially encrypted and partially unencrypted', ct => {
  const str = `
    # .env
    HELLO=unencrypted
    HELLO=encrypted:1234
  `.trim()

  const result = isFullyEncrypted(str)
  ct.same(result, false, 'Some values are unencrypted')
  ct.end()
})

t.test('#isFullyEncrypted - Encrypted values with DOTENV_PUBLIC_KEY', ct => {
  const str = `
    #/-------------------[DOTENV_PUBLIC_KEY]--------------------/
    #/            public-key encryption for .env files          /
    #/       [how it works](https://dotenvx.com/encryption)     /
    #/----------------------------------------------------------/
    DOTENV_PUBLIC_KEY="0395dc734661dfd7a2d6581cd2c8864038028c2570f6586771534525767341d1b2"

    # .env
    HELLO="encrypted:BFYjx93CX4d4OIRzYMR+ZT+JR92kCfOJSsivsXxwaQHvA5FJgHa50rUHWhj1t72LLeRkLE2v4GrKpW5w1bjinXEmXtAV28k2audEVW6cBU7YapLVcPvrV2FkNqbMEKRvp78C0wKaMvNarg=="
  `.trim()

  const result = isFullyEncrypted(str)
  ct.same(result, true, 'Encrypted values with DOTENV_PUBLIC_KEY')
  ct.end()
})

t.test('#isFullyEncrypted - Keys starting with DOTENV_PUBLIC_KEY are considered valid', ct => {
  const str = `
    # .env
    DOTENV_PUBLIC_KEY_ENVIRONMENT="somevalue"
    HELLO="encrypted:BFYjx93CX4d4OIRzYMR+ZT+JR92kCfOJSsivsXxwaQHvA5FJgHa50rUHWhj1t72LLeRkLE2v4GrKpW5w1bjinXEmXtAV28k2audEVW6cBU7YapLVcPvrV2FkNqbMEKRvp78C0wKaMvNarg=="
  `.trim()

  const result = isFullyEncrypted(str)
  ct.same(result, true, 'Keys starting with DOTENV_PUBLIC_KEY are considered valid')
  ct.end()
})
