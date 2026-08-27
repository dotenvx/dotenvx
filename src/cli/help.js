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

const del = function () {
  return `
Examples:

  \`\`\`
  $ dotenvx del KEY
  $ dotenvx del KEY -f .env.production
  \`\`\`
  `
}

const curl = function () {
  return `
Endpoints:

  GET    /api/account
  GET    /api/armor/keypairs
  GET    /api/armor/keypairs/:public_key
  POST   /api/armor/keypairs/:public_key/name
  POST   /api/armor/keypairs/:public_key/members/:member_id/grant
  POST   /api/armor/keypairs/:public_key/members/:member_id/revoke
  POST   /api/armor/keypairs/:public_key/settings/guard
  POST   /api/armor/keypairs/:public_key/settings/enclave
  GET    /api/teams
  GET    /api/teams/:team
  GET    /api/teams/:team/members
  POST   /api/teams/:team/members/:member_id/keypairs/:public_key/grant
  POST   /api/teams/:team/members/:member_id/keypairs/:public_key/revoke
  GET    /api/teams/:team/invitations
  POST   /api/teams/:team/invitations
  POST   /api/teams/:team/invitations/:id/cancel
  GET    /api/join_requests
  POST   /api/join_requests
  POST   /api/join_requests/:id/cancel
  GET    /api/teams/:team/join_requests
  POST   /api/teams/:team/join_requests/:id/accept
  POST   /api/teams/:team/join_requests/:id/decline
  POST   /api/armor/:team/settings/join_requests
  GET    /api/logs?team=:team

Examples:

  dotenvx curl "https://armor.dotenvx.com/api/account"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs?page=1&per=100"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs?sort=name_asc"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs?sort=public_key_desc"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY"
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/name" --data '{"name":"Production"}'
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/name" --data '{"name":null}'
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/members/123/grant" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/members/123/revoke" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/settings/guard" --data '{"value":true}'
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/settings/guard" --data '{"value":false}'
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/settings/enclave" --data '{"value":true}'
  dotenvx curl "https://armor.dotenvx.com/api/armor/keypairs/PUBLIC_KEY/settings/enclave" --data '{"value":false}'
  dotenvx curl "https://armor.dotenvx.com/api/teams"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/members"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/members/123/keypairs/PUBLIC_KEY/grant" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/members/123/keypairs/PUBLIC_KEY/revoke" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/invitations"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/invitations" --data '{"email":"person@example.com","role":"member"}'
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/invitations/123/cancel" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/join_requests"
  dotenvx curl "https://armor.dotenvx.com/api/join_requests" --data '{"team":"TEAM"}'
  dotenvx curl "https://armor.dotenvx.com/api/join_requests/123/cancel" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/join_requests"
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/join_requests/123/accept" --data '{"role":"member"}'
  dotenvx curl "https://armor.dotenvx.com/api/teams/TEAM/join_requests/123/decline" --request POST
  dotenvx curl "https://armor.dotenvx.com/api/armor/TEAM/settings/join_requests" --data '{"value":true}'
  dotenvx curl "https://armor.dotenvx.com/api/logs?team=TEAM"
  dotenvx curl "https://armor.dotenvx.com/api/logs?team=TEAM&events=keypair/access&user=USERNAME&keypair=KEYPAIR_ID&page=1&per=100"
  dotenvx curl "https://armor.dotenvx.com/api/logs?team=TEAM&user=missing&keypair=missing"
  `
}

module.exports = {
  run,
  precommit,
  prebuild,
  gitignore,
  set,
  del,
  curl
}
