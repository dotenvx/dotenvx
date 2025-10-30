const run = function () {
  return `
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
}

const precommit = function () {
  return `
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
}

const prebuild = function () {
  return `
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
}

const gitignore = function () {
  return `
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
}

const LOCK_TRYIT_EXAMPLE_STRING = `
Try it:

  \`\`\`
  $ echo "HELLO=Production" > .env.production
  $ dotenvx encrypt -f .env.production
  ✔ encrypted (.env.production)
  ✔ key added to .env.keys (DOTENV_PRIVATE_KEY_PRODUCTION)

  $ dotenvx ext lock myPassword -f .env.production
  ✔ .env.keys (DOTENV_PRIVATE_KEY_PRODUCTION) locked
  \`\`\`

`

const lock = function () {
  return `
Examples:

  \`\`\`
  $ dotenvx ext lock mySecretPassphrase -f .env.production -fk .env.production.keys -s mySalt
  $ dotenvx ext lock mySecretPassphrase
  \`\`\`

${LOCK_TRYIT_EXAMPLE_STRING}
  \`\`\`
  `
}

const set = function () {
  return `
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
}

const unlock = function () {
  return `
Examples:

  \`\`\`
  $ dotenvx ext unlock mySecretPassphrase -f .env.production -fk .env.production.keys -s mySalt
  $ dotenvx ext unlock mySecretPassphrase
  \`\`\`

${LOCK_TRYIT_EXAMPLE_STRING}

  $ dotenvx ext unlock myPassword -f .env.production
  ✔ .env.keys (DOTENV_PRIVATE_KEY_PRODUCTION) unlocked
  \`\`\`
  `
}

module.exports = {
  run,
  precommit,
  prebuild,
  gitignore,
  set,
  lock,
  unlock,
  LOCK_TRYIT_EXAMPLE_STRING
}
