const tap = require('tap')
const {
  run,
  precommit,
  prebuild,
  gitignore,
  set,
  curl
} = require('../../src/cli/help')

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
  [dotenvx] injected env (1) from .env
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
  $ dotenvx precommit
  $ dotenvx precommit --install
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx precommit
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
  $ dotenvx prebuild
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx prebuild
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
  $ dotenvx gitignore
  $ dotenvx gitignore --pattern .env.keys
  \`\`\`

  Try it:

  \`\`\`
  $ dotenvx gitignore
  ▣ ignored .env* (.gitignore)
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

tap.test('curl function returns API endpoints and examples', (t) => {
  const output = curl()

  t.match(output, /Endpoints:\s+GET\s+\/api\/account/)
  t.match(output, /POST\s+\/api\/armor\/keypairs\/:public_key\/settings\/guard/)
  t.match(output, /DELETE \/api\/teams\/:team\/invitations\/:id/)
  t.match(output, /dotenvx curl https:\/\/armor\.dotenvx\.com\/api\/account/)
  t.match(output, /--request DELETE/)
  t.end()
})
