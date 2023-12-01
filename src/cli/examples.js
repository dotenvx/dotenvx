
const run = function () {
  return `
Example:

  \`\`\`sh
  $ dotenvx run -- your-cmd
  \`\`\`

Try it:

  \`\`\`sh
  $ echo "HELLO=World" > .env
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ dotenvx run -- node index.js
  [dotenvx][info] loading env (1) from .env
  Hello World
  \`\`\`
  `
}

const encrypt = function () {
  return `
Example:

  \`\`\`sh
  $ dotenvx encrypt
  \`\`\`

Try it:

  \`\`\`sh
  $ echo "HELLO=World" > .env
  $ echo "HELLO=production" > .env.production
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ dotenvx encrypt
  [dotenvx][info] encrypted to .env.vault (.env,.env.production)
  [dotenvx][info] keys added to .env.keys (DOTENV_KEY_PRODUCTION,DOTENV_KEY_PRODUCTION)

  $ DOTENV_KEY='<dotenv_key_production>' dotenvx run -- node index.js
  [dotenvx][info] loading env (1) from encrypted .env.vault
  Hello production
  \`\`\`
  `
}

module.exports = {
  run,
  encrypt
}
