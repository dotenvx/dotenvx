const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('single quote bug test cases', ct => {
  const testPath = 'tests/.env.expand.single-quotes-bug'
  const env = dotenvx.config({ path: testPath })

  // Log all parsed values for debugging
  console.log('All parsed values:', JSON.stringify(env.parsed, null, 2))

  // Case 1: Doesn't work - first variable in single quotes
  ct.equal(env.parsed.PGUSER, 'user', 'PGUSER should be user')
  ct.equal(env.parsed.PGHOST, 'localhost', 'PGHOST should be localhost')
  // This should expand both variables but currently fails for PGHOST
  ct.equal(env.parsed.DATABASE_URL, 'postgres://user@localhost/my_database', 'DATABASE_URL should expand both variables')

  // Case 2: Doesn't work - first variable in single quotes, second in double quotes  
  ct.equal(env.parsed.PGUSER2, 'user', 'PGUSER2 should be user')
  ct.equal(env.parsed.PGHOST2, 'localhost', 'PGHOST2 should be localhost')
  ct.equal(env.parsed.DATABASE_URL2, 'postgres://user@localhost/my_database', 'DATABASE_URL2 should expand both variables')

  // Case 3: Works - first variable in double quotes
  ct.equal(env.parsed.PGUSER3, 'user', 'PGUSER3 should be user')
  ct.equal(env.parsed.PGHOST3, 'localhost', 'PGHOST3 should be localhost')
  ct.equal(env.parsed.DATABASE_URL3, 'postgres://user@localhost/my_database', 'DATABASE_URL3 should expand both variables')

  // Case 4: Both variables in single quotes
  ct.equal(env.parsed.PGUSER4, 'user', 'PGUSER4 should be user')
  ct.equal(env.parsed.PGHOST4, 'localhost', 'PGHOST4 should be localhost')
  ct.equal(env.parsed.DATABASE_URL4, 'postgres://user@localhost/my_database', 'DATABASE_URL4 should expand both variables')

  // Case 5: Both variables in double quotes (should work)
  ct.equal(env.parsed.PGUSER5, 'user', 'PGUSER5 should be user')
  ct.equal(env.parsed.PGHOST5, 'localhost', 'PGHOST5 should be localhost')
  ct.equal(env.parsed.DATABASE_URL5, 'postgres://user@localhost/my_database', 'DATABASE_URL5 should expand both variables')

  ct.end()
})