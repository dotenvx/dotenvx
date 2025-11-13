const t = require('tap')
const expandVariables = require('../../../src/lib/helpers/expandVariables')

/* eslint-disable no-template-curly-in-string */

t.test('basic variable expansion', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('$BASIC', env)
  ct.same(result, 'expanded')
  ct.end()
})

t.test('braced variable expansion', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('${BASIC}', env)
  ct.same(result, 'expanded')
  ct.end()
})

t.test('undefined variable becomes empty string', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('$UNDEFINED', env)
  ct.same(result, '')
  ct.end()
})

t.test('default value with :- operator', ct => {
  const env = { UNDEFINED: undefined }
  const result = expandVariables('${UNDEFINED:-default}', env)
  ct.same(result, 'default')
  ct.end()
})

t.test('default value with - operator', ct => {
  const env = { UNDEFINED: undefined }
  const result = expandVariables('${UNDEFINED-default}', env)
  ct.same(result, 'default')
  ct.end()
})

t.test('default value not used when variable exists', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('${BASIC:-default}', env)
  ct.same(result, 'expanded')
  ct.end()
})

t.test('alternative value with :+ operator', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('${BASIC:+alternative}', env)
  ct.same(result, 'alternative')
  ct.end()
})

t.test('alternative value with + operator', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('${BASIC+alternative}', env)
  ct.same(result, 'alternative')
  ct.end()
})

t.test('alternative value not used when variable undefined', ct => {
  const env = { UNDEFINED: undefined }
  const result = expandVariables('${UNDEFINED:+alternative}', env)
  ct.same(result, '')
  ct.end()
})

t.test('multiple expansions in same string', ct => {
  const env = { FIRST: 'one', SECOND: 'two' }
  const result = expandVariables('$FIRST and $SECOND', env)
  ct.same(result, 'one and two')
  ct.end()
})

t.test('nested default values', ct => {
  const env = { UNDEFINED: undefined, UNDEFINED2: undefined }
  const result = expandVariables('${UNDEFINED:-${UNDEFINED2:-nested}}', env)
  ct.same(result, 'nested')
  ct.end()
})

t.test('self-referential expansion stops', ct => {
  const env = { SELF: '$SELF' }
  const result = expandVariables('$SELF', env)
  ct.same(result, '$SELF')
  ct.end()
})

t.test('escaped dollar signs are not expanded', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('\\$BASIC', env)
  ct.same(result, '\\$BASIC')
  ct.end()
})

t.test('literals check prevents cascading expansion', ct => {
  // Test case: expanding a string that contains a variable whose literal value has expansion patterns
  const env = { VAR1: 'value1', VAR2: '$VAR1' }
  const literals = { VAR2: '$VAR1' } // VAR2 is a literal containing expansion patterns
  // When expanding '$VAR2', it should expand to '$VAR1' and stop (not expand further to 'value1')
  const result = expandVariables('$VAR2', env, literals)
  ct.same(result, '$VAR1')
  ct.end()
})

t.test('literals check allows normal expansion when literal has no patterns', ct => {
  const env = { NORMAL_VAR: 'should expand' }
  const literals = { NORMAL_VAR: 'no expansion patterns here' }
  const result = expandVariables('$NORMAL_VAR', env, literals)
  ct.same(result, 'should expand')
  ct.end()
})

t.test('literals check prevents cascading with braced expansion', ct => {
  const env = { VAR1: 'value1', VAR2: '${VAR1}' }
  const literals = { VAR2: '${VAR1}' }
  const result = expandVariables('$VAR2', env, literals)
  ct.same(result, '${VAR1}')
  ct.end()
})

t.test('empty literals object works', ct => {
  const env = { BASIC: 'expanded' }
  const result = expandVariables('$BASIC', env, {})
  ct.same(result, 'expanded')
  ct.end()
})

t.test('complex nested expansion with defaults', ct => {
  const env = {
    UNDEFINED1: undefined,
    UNDEFINED2: undefined,
    BASIC: 'basic_value'
  }
  const result = expandVariables('${UNDEFINED1:-prefix-${UNDEFINED2:-${BASIC}}-suffix}', env)
  ct.same(result, 'prefix-basic_value-suffix')
  ct.end()
})

t.test('expansion with special characters in default', ct => {
  const env = { UNDEFINED: undefined }
  const result = expandVariables('${UNDEFINED:-/path/with:colons}', env)
  ct.same(result, '/path/with:colons')
  ct.end()
})
