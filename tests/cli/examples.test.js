const tap = require('tap')
const {
  run,
  precommit,
  prebuild,
  gitignore,
  set
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

  $ dotenvx run -- node index.js
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
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx ext gitignore
  done
  \`\`\`
  `
  t.equal(gitignore(), expected)
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
