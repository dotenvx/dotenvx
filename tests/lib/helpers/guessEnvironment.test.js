const t = require('tap')

const guessEnvironment = require('../../../src/lib/helpers/guessEnvironment')

t.test('#guessEnvironment (.env)', ct => {
  const filepath = '.env'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'development')

  ct.end()
})

t.test('#guessEnvironment (.env.production)', ct => {
  const filepath = '.env.production'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'production')

  ct.end()
})

t.test("#guessEnvironment (.env.local)", (ct) => {
  const filepath = ".env.local";
  const environment = guessEnvironment(filepath);

  ct.same(environment, "local");

  ct.end();
});

t.test("#guessEnvironment (.env.development.local)", (ct) => {
  const filepath = ".env.development.local";
  const environment = guessEnvironment(filepath);

  ct.same(environment, "development_local");

  ct.end();
});

t.test("#guessEnvironment (.env.development.production)", (ct) => {
  const filepath = ".env.development.production";
  const environment = guessEnvironment(filepath);

  ct.same(environment, "development");

  ct.end();
});
