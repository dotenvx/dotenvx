const t = require('tap')

const guessPrivateKeyFilename = require('../../../src/lib/helpers/guessPrivateKeyFilename')

t.test('#guessPrivateKeyFilename (DOTENV_PRIVATE_KEY)', ct => {
  const result = guessPrivateKeyFilename('DOTENV_PRIVATE_KEY')

  ct.same(result, '.env')

  ct.end()
})

t.test('#guessPrivateKeyFilename (DOTENV_PRIVATE_KEY_PRODUCTION)', ct => {
  const result = guessPrivateKeyFilename('DOTENV_PRIVATE_KEY_PRODUCTION')

  ct.same(result, '.env.production')

  ct.end()
})

t.test('#guessPrivateKeyFilename (DOTENV_PRIVATE_KEY_CI)', ct => {
  const result = guessPrivateKeyFilename('DOTENV_PRIVATE_KEY_CI')

  ct.same(result, '.env.ci')

  ct.end()
})

t.test('#guessPrivateKeyFilename (DOTENV_PRIVATE_KEY_DEVELOPMENT_LOCAL)', ct => {
  const result = guessPrivateKeyFilename('DOTENV_PRIVATE_KEY_DEVELOPMENT_LOCAL')

  ct.same(result, '.env.development.local')

  ct.end()
})

t.test('#guessPrivateKeyFilename (DOTENV_PRIVATE_KEY_DEVELOPMENT_LOCAL_ME)', ct => {
  const result = guessPrivateKeyFilename('DOTENV_PRIVATE_KEY_DEVELOPMENT_LOCAL_ME')

  ct.same(result, '.env.development.local.me')

  ct.end()
})
