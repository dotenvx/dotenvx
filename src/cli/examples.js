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

const encrypt = function () {
  return `
Examples:

  \`\`\`
  $ dotenvx encrypt
  \`\`\`

Try it:

  \`\`\`
  $ echo "HELLO=World" > .env
  $ echo "HELLO=production" > .env.production
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ dotenvx encrypt
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
  $ dotenvx precommit
  $ dotenvx precommit --install
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx precommit
  [dotenvx@0.10.0][precommit] success
  \`\`\`
  `
}

const prebuild = function () {
  return `
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
}

const gitignore = function () {
  return `
Examples:

  \`\`\`
  $ dotenvx gitignore
  \`\`\`

Try it:

  \`\`\`
  $ dotenvx gitignore
  done
  \`\`\`
  `
}

module.exports = {
  run,
  encrypt,
  precommit,
  prebuild,
  gitignore
}
