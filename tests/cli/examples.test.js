const tap = require('tap')
const {
  run,
  precommit,
  prebuild,
  gitignore,
  set,
  lock,
  unlock,
  LOCK_TRYIT_EXAMPLE_STRING
} = require('../../src/cli/examples') // Adjust the path as needed

tap.test('run function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx run -- npm run dev
  $ dotenvx run -- flask --app index run
  $ dotenvx run -- php artisan serve
  $ dotenvx run -- bin/rails s
  \`\`\`

Try it:

  \`\`\`
  $ echo "HELLO=World" > .env
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ dotenvx run -f .env -- node index.js
  [dotenvx] injecting env (1) from .env
  Hello World
  \`\`\`
  `
  t.equal(run(), expected)
  t.end()
})

tap.test('precommit function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx ext precommit
  $ dotenvx ext precommit --install
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx ext precommit
  [dotenvx@0.45.0][precommit] success
  \`\`\`
  `
  t.equal(precommit(), expected)
  t.end()
})

tap.test('prebuild function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx ext prebuild
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx ext prebuild
  [dotenvx@0.10.0][prebuild] success
  \`\`\`
  `
  t.equal(prebuild(), expected)
  t.end()
})

tap.test('gitignore function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx ext gitignore
  $ dotenvx ext gitignore --pattern .env.keys
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx ext gitignore
  ✔ ignored .env* (.gitignore)
  \`\`\`
  `
  t.equal(gitignore(), expected)
  t.end()
})

tap.test('lock function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx ext lock mySecretPassphrase -f .env.production -fk .env.production.keys -s mySalt
  $ dotenvx ext lock mySecretPassphrase
  $ dotenvx ext lock --prompt
  \`\`\`

${LOCK_TRYIT_EXAMPLE_STRING}
  `

  t.equal(lock(), expected)
  t.end()
})

tap.test('set function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx set KEY value
  $ dotenvx set KEY "value with spaces"
  $ dotenvx set KEY -- "---value with a dash---"
  $ dotenvx set KEY -- "-----BEGIN OPENSSH PRIVATE KEY-----
                        b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
                        -----END OPENSSH PRIVATE KEY-----"
  \`\`\`
  `
  t.equal(set(), expected)
  t.end()
})

tap.test('unlock function returns expected string', (t) => {
  const expected = `
Examples:

  \`\`\`
  $ dotenvx ext unlock mySecretPassphrase -f .env.production -fk .env.production.keys -s mySalt
  $ dotenvx ext unlock mySecretPassphrase
  $ dotenvx ext unlock --prompt
  \`\`\`

${LOCK_TRYIT_EXAMPLE_STRING}
  `

  t.equal(unlock(), expected)
  t.end()
})
