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
  t.match(output, /GET\s+\/api\/logs\?team=:team/)
  t.match(output, /POST\s+\/api\/armor\/keypairs\/:public_key\/settings\/guard/)
  t.match(output, /POST\s+\/api\/teams\/:team\/invitations\/:id\/cancel/)
  t.match(output, /POST\s+\/api\/teams\/:team\/members\/:member_id\/keypairs\/:public_key\/grant/)
  t.match(output, /POST\s+\/api\/teams\/:team\/members\/:member_id\/keypairs\/:public_key\/revoke/)
  t.match(output, /POST\s+\/api\/armor\/keypairs\/:public_key\/members\/:member_id\/grant/)
  t.match(output, /POST\s+\/api\/armor\/keypairs\/:public_key\/members\/:member_id\/revoke/)
  t.match(output, /GET\s+\/api\/join_requests/)
  t.match(output, /POST\s+\/api\/join_requests/)
  t.match(output, /POST\s+\/api\/join_requests\/:id\/cancel/)
  t.match(output, /GET\s+\/api\/teams\/:team\/join_requests/)
  t.match(output, /POST\s+\/api\/teams\/:team\/join_requests\/:id\/accept/)
  t.match(output, /POST\s+\/api\/teams\/:team\/join_requests\/:id\/decline/)
  t.match(output, /POST\s+\/api\/armor\/:team\/settings\/join_requests/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/account"/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/keypairs\?page=1&per=100"/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/keypairs\?sort=name_asc"/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/keypairs\?sort=public_key_desc"/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/keypairs\/PUBLIC_KEY\/name" --data '\{"name":"Production"\}'/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/keypairs\/PUBLIC_KEY\/name" --data '\{"name":null\}'/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/join_requests" --data '\{"team":"TEAM"\}'/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/teams\/TEAM\/invitations\/123\/cancel" --request POST/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/join_requests\/123\/cancel" --request POST/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/keypairs\/PUBLIC_KEY\/members\/123\/grant" --request POST/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/teams\/TEAM\/members\/123\/keypairs\/PUBLIC_KEY\/revoke" --request POST/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/teams\/TEAM\/join_requests\/123\/accept" --data '\{"role":"member"\}'/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/armor\/TEAM\/settings\/join_requests" --data '\{"value":true\}'/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/logs\?team=TEAM"/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/logs\?team=TEAM&events=keypair\/access&user=USERNAME&keypair=KEYPAIR_ID&page=1&per=100"/)
  t.match(output, /dotenvx curl "https:\/\/armor\.dotenvx\.com\/api\/logs\?team=TEAM&user=missing&keypair=missing"/)
  t.notMatch(output, /--request DELETE/)
  t.end()
})
