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
  [dotenvx] injected env (1) from .env
  Hello World
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
  [dotenvx@0.45.0][precommit] success
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
  $ dotenvx gitignore --pattern .env.keys
  \`\`\`

  Try it:

  \`\`\`
  $ dotenvx gitignore
  ▣ ignored .env* (.gitignore)
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

const curl = function () {
  return `
Endpoints:

  GET    /api/account
  GET    /api/armor/keypairs
  GET    /api/armor/keypairs/:public_key
  POST   /api/armor/keypairs/:public_key/settings/guard
  POST   /api/armor/keypairs/:public_key/settings/enclave
  GET    /api/teams
  GET    /api/teams/:team
  GET    /api/teams/:team/members
  GET    /api/teams/:team/invitations
  POST   /api/teams/:team/invitations
  DELETE /api/teams/:team/invitations/:id
  GET    /api/logs?team=:team

Examples:

  dotenvx curl "https://armor.dotenvx.com/api/account"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/settings/guard" --data '{"value":true}'
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/settings/enclave" --data '{"value":true}'
  dotenvx curl "https://armor.dotenvx.com/api/teams"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/members"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/members"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/invitations" --data '{"email":"person@example.com","role":"member"}'
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/invitations/123" --request DELETE
  dotenvx curl "https://armor.dotenvx.com/api/logs?team=TEAM"
  `
}

module.exports = {
  run,
  precommit,
  prebuild,
  gitignore,
  set,
  curl
}
