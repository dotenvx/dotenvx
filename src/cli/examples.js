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

  $ dotenvx run -- node index.js
  [dotenvx] injecting env (1) from .env
  Hello World
  \`\`\`
  `
}

const vaultEncrypt = function () {
  return `
Examples:

  \`\`\`
  $ dotenvx ext vault encrypt
  \`\`\`

Try it:

  \`\`\`
  $ echo "HELLO=World" > .env
  $ echo "HELLO=production" > .env.production
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ dotenvx ext vault encrypt
  encrypted to .env.vault (.env,.env.production)
  keys added to .env.keys (DOTENV_KEY_PRODUCTION,DOTENV_KEY_PRODUCTION)

  $ DOTENV_KEY='<dotenv_key_production>' dotenvx run -- node index.js
  [dotenvx] injecting env (1) from encrypted .env.vault
  Hello production
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
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx ext gitignore
  done
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

module.exports = {
  run,
  vaultEncrypt,
  precommit,
  prebuild,
  gitignore,
  set
}
