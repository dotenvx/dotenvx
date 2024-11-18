const t = require('tap')

const Parse = require('../../../src/lib/helpers/parse')

let src
let privateKey

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {
    MACHINE: 'machine'
  }

  privateKey = 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1'

  // reset
  src = `#!/usr/bin/env bash
HELLO=world
export EXPORT=export

# previous line intentional left blank
AFTER_LINE=after_line
EMPTY=
EMPTY_SINGLE_QUOTES=''
EMPTY_DOUBLE_QUOTES=""
EMPTY_BACKTICKS=\`\`
SINGLE_QUOTES='single_quotes'
SINGLE_QUOTES_SPACED='    single quotes    '
DOUBLE_QUOTES="double_quotes"
DOUBLE_QUOTES_SPACED="    double quotes    "
DOUBLE_QUOTES_INSIDE_SINGLE='double "quotes" work inside single quotes'
# DOUBLE_QUOTES_WITH_NO_SPACE_BRACKET="{ port: $MONGOLAB_PORT}"
SINGLE_QUOTES_INSIDE_DOUBLE="single 'quotes' work inside double quotes"
BACKTICKS_INSIDE_SINGLE='\`backticks\` work inside single quotes'
BACKTICKS_INSIDE_DOUBLE="\`backticks\` work inside double quotes"
BACKTICKS=\`backticks\`
BACKTICKS_SPACED=\`    backticks    \`
DOUBLE_QUOTES_INSIDE_BACKTICKS=\`double "quotes" work inside backticks\`
SINGLE_QUOTES_INSIDE_BACKTICKS=\`single 'quotes' work inside backticks\`
DOUBLE_AND_SINGLE_QUOTES_INSIDE_BACKTICKS=\`double "quotes" and single 'quotes' work inside backticks\`
EXPAND_NEWLINES="expand\\nnew\\nlines"
DONT_EXPAND_UNQUOTED=dontexpand\\nnewlines
DONT_EXPAND_SQUOTED='dontexpand\\nnewlines'
# COMMENTS=work
INLINE_COMMENTS=inline comments # work #very #well
INLINE_COMMENTS_SINGLE_QUOTES='inline comments outside of #singlequotes' # work
INLINE_COMMENTS_DOUBLE_QUOTES="inline comments outside of #doublequotes" # work
INLINE_COMMENTS_BACKTICKS=\`inline comments outside of #backticks\` # work
INLINE_COMMENTS_SPACE=inline comments start with a#number sign. no space required.
EQUAL_SIGNS=equals==
RETAIN_INNER_QUOTES={"foo": "bar"}
RETAIN_INNER_QUOTES_AS_STRING='{"foo": "bar"}'
RETAIN_INNER_QUOTES_AS_BACKTICKS=\`{"foo": "bar's"}\`
TRIM_SPACE_FROM_UNQUOTED=    some spaced out string
USERNAME=therealnerdybeast@example.tld
    SPACED_KEY = parsed
ENCRYPTED="encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=="
ECHO="$(echo echo)"
ECHO_SQUOTED='$(echo echo)'
ECHO_UNQUOTED=$(echo echo)
BASIC=basic
BASIC_EXPAND=$BASIC
MACHINE=file
MACHINE_EXPAND=$MACHINE
ESCAPED_EXPAND=\\$ESCAPED
EXPAND_DEFAULT=$\{MACHINE:-default}
EXPAND_DEFAULT_NESTED=$\{MACHINE:-$\{UNDEFINED:-default}}
EXPAND_DEFAULT_NESTED2=$\{MACHINE-$\{UNDEFINED-default}}
EXPAND_DEFAULT_NESTED_TWICE=$\{UNDEFINED:-$\{MACHINE}$\{UNDEFINED:-default}}
EXPAND_DEFAULT_NESTED_TWICE2=$\{UNDEFINED-$\{MACHINE}$\{UNDEFINED-default}}
EXPAND_DEFAULT_SPECIAL_CHARACTERS=$\{MACHINE:-/default/path:with/colon}
EXPAND_DEFAULT_SPECIAL_CHARACTERS2=$\{MACHINE-/default/path:with/colon}
UNDEFINED_EXPAND=$UNDEFINED
UNDEFINED_EXPAND_NESTED=$\{UNDEFINED:-$\{MACHINE:-default}}
UNDEFINED_EXPAND_DEFAULT=$\{UNDEFINED:-default}
UNDEFINED_EXPAND_DEFAULT2=$\{UNDEFINED-default}
UNDEFINED_EXPAND_DEFAULT_NESTED=$\{UNDEFINED:-$\{UNDEFINED:-default}}
UNDEFINED_EXPAND_DEFAULT_NESTED2=$\{UNDEFINED-$\{UNDEFINED-default}}
UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE=$\{UNDEFINED:-$\{UNDEFINED:-$\{UNDEFINED:-default}}}
UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2=$\{UNDEFINED-$\{UNDEFINED-$\{UNDEFINED-default}}}
UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS=$\{UNDEFINED:-/default/path:with/colon}
UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2=$\{UNDEFINED-/default/path:with/colon}
UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED=$\{UNDEFINED:-$\{UNDEFINED_2:-/default/path:with/colon}}
UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2=$\{UNDEFINED-$\{UNDEFINED_2-/default/path:with/colon}}
# https://github.com/dotenvx/dotenvx/issues/422#issuecomment-2438293073
SINGLE_QUOTE='$BASIC'

# https://github.com/dotenvx/dotenvx/issues/433
DEEP8=$\{QUXX:-prefix5-$\{QUX:-prefix4-$\{BAZ:-prefix3-$\{BAR:-prefix2-$\{FOO:-prefix1-$\{BASIC:-test}-suffix1}-suffix2}-suffix3}-suffix4}-suffix5}
DEEP_SELF=$\{DEEP_SELF:-$\{BASIC:-test}-bar}
DEEP_SELF_PRIOR=foo
DEEP_SELF_PRIOR=prefix2-$\{DEEP_SELF_PRIOR:-prefix1-$\{BASIC:-test}-suffix2}-suffix2

NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS=$UNDEFINED:-/default/path:with/colon
NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2=$UNDEFINED-/default/path:with/colon

# progressive update
PROGRESSIVE=first
PROGRESSIVE=$\{PROGRESSIVE}-second

DASH=hi-dash

USE_IF_SET=true
ALTERNATE=$\{USE_IF_SET:+alternate}
`
})

t.test('#run', ct => {
  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    HELLO: 'world',
    EXPORT: 'export',
    AFTER_LINE: 'after_line',
    EMPTY: '',
    EMPTY_SINGLE_QUOTES: '',
    EMPTY_DOUBLE_QUOTES: '',
    EMPTY_BACKTICKS: '',
    SINGLE_QUOTES: 'single_quotes',
    SINGLE_QUOTES_SPACED: '    single quotes    ',
    DOUBLE_QUOTES: 'double_quotes',
    DOUBLE_QUOTES_SPACED: '    double quotes    ',
    DOUBLE_QUOTES_INSIDE_SINGLE: 'double "quotes" work inside single quotes',
    // DOUBLE_QUOTES_WITH_NO_SPACE_BRACKET: '{ port: $MONGOLAB_PORT}',
    SINGLE_QUOTES_INSIDE_DOUBLE: "single 'quotes' work inside double quotes",
    BACKTICKS_INSIDE_SINGLE: '`backticks` work inside single quotes',
    BACKTICKS_INSIDE_DOUBLE: '`backticks` work inside double quotes',
    BACKTICKS: 'backticks',
    BACKTICKS_SPACED: '    backticks    ',
    DOUBLE_QUOTES_INSIDE_BACKTICKS: 'double "quotes" work inside backticks',
    SINGLE_QUOTES_INSIDE_BACKTICKS: "single 'quotes' work inside backticks",
    DOUBLE_AND_SINGLE_QUOTES_INSIDE_BACKTICKS: 'double "quotes" and single \'quotes\' work inside backticks',
    EXPAND_NEWLINES: `expand
new
lines`,
    DONT_EXPAND_UNQUOTED: 'dontexpand\\nnewlines',
    DONT_EXPAND_SQUOTED: 'dontexpand\\nnewlines',
    INLINE_COMMENTS: 'inline comments',
    INLINE_COMMENTS_SINGLE_QUOTES: 'inline comments outside of #singlequotes',
    INLINE_COMMENTS_DOUBLE_QUOTES: 'inline comments outside of #doublequotes',
    INLINE_COMMENTS_BACKTICKS: 'inline comments outside of #backticks',
    INLINE_COMMENTS_SPACE: 'inline comments start with a',
    EQUAL_SIGNS: 'equals==',
    RETAIN_INNER_QUOTES: '{"foo": "bar"}',
    RETAIN_INNER_QUOTES_AS_STRING: '{"foo": "bar"}',
    RETAIN_INNER_QUOTES_AS_BACKTICKS: '{"foo": "bar\'s"}',
    TRIM_SPACE_FROM_UNQUOTED: 'some spaced out string',
    USERNAME: 'therealnerdybeast@example.tld',
    SPACED_KEY: 'parsed',
    ENCRYPTED: 'encrypted',
    ECHO: 'echo',
    ECHO_SQUOTED: '$(echo echo)',
    ECHO_UNQUOTED: 'echo',
    BASIC: 'basic',
    BASIC_EXPAND: 'basic',
    MACHINE: 'machine',
    MACHINE_EXPAND: 'machine',
    ESCAPED_EXPAND: '$ESCAPED',
    EXPAND_DEFAULT: 'machine',
    EXPAND_DEFAULT_NESTED: 'machine',
    EXPAND_DEFAULT_NESTED2: 'machine',
    EXPAND_DEFAULT_NESTED_TWICE: 'machinedefault',
    EXPAND_DEFAULT_NESTED_TWICE2: 'machinedefault',
    EXPAND_DEFAULT_SPECIAL_CHARACTERS: 'machine',
    EXPAND_DEFAULT_SPECIAL_CHARACTERS2: 'machine',
    UNDEFINED_EXPAND: '',
    UNDEFINED_EXPAND_NESTED: 'machine',
    UNDEFINED_EXPAND_DEFAULT: 'default',
    UNDEFINED_EXPAND_DEFAULT2: 'default',
    UNDEFINED_EXPAND_DEFAULT_NESTED: 'default',
    UNDEFINED_EXPAND_DEFAULT_NESTED2: 'default',
    UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE: 'default',
    UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2: 'default',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS: '/default/path:with/colon',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2: '/default/path:with/colon',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED: '/default/path:with/colon',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2: '/default/path:with/colon',
    NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS: ':-/default/path:with/colon',
    NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2: '-/default/path:with/colon',
    SINGLE_QUOTE: '$BASIC',
    DEEP8: 'prefix5-prefix4-prefix3-prefix2-prefix1-basic-suffix1-suffix2-suffix3-suffix4-suffix5',
    DEEP_SELF: 'basic-bar',
    DEEP_SELF_PRIOR: 'prefix2-foo-suffix2',
    PROGRESSIVE: 'first-second',
    DASH: 'hi-dash',
    USE_IF_SET: 'true',
    ALTERNATE: 'alternate'
  })

  ct.end()
})

t.test('#run - self referencing', ct => {
  src = `# .env
ITSELF=$ITSELF
ITSELF2=$ITSELF2`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    ITSELF: '',
    ITSELF2: ''
  })

  ct.end()
})

t.test('#run - self referencing and set in process.env', ct => {
  // for testing the 'seen' set check
  process.env = {
    ITSELF: 'itself'
  }

  src = `# .env
ITSELF=$ITSELF
ITSELF2=$ITSELF2`

  const { parsed } = new Parse(src).run()

  ct.same(parsed, {
    ITSELF: 'itself',
    ITSELF2: ''
  })

  ct.end()
})

t.test('#run - self referencing and also self referenced in process.env', ct => {
  process.env = {
    ITSELF: '$ITSELF'
  }

  src = `# .env
ITSELF=$ITSELF
ITSELF2=$ITSELF2`

  const { parsed } = new Parse(src).run()

  ct.same(parsed, {
    ITSELF: '',
    ITSELF2: ''
  })

  ct.end()
})

t.test('#run - alternate', ct => {
  src = `# .env
USE_CUSTOM_CONFIG=true
CUSTOM_CONFIG=$\{USE_CUSTOM_CONFIG:+custom-config.json}
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    USE_CUSTOM_CONFIG: 'true',
    CUSTOM_CONFIG: 'custom-config.json'
  })

  ct.end()
})

t.test('#run - alternate but not set', ct => {
  src = `# .env
CUSTOM_CONFIG=$\{USE_CUSTOM_CONFIG:+custom-config.json}
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    CUSTOM_CONFIG: ''
  })

  ct.end()
})

t.test('#run - alternate but set in process.env', ct => {
  process.env.USE_CUSTOM_CONFIG = '1'

  src = `# .env
CUSTOM_CONFIG=$\{USE_CUSTOM_CONFIG:+custom-config.json}
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    CUSTOM_CONFIG: 'custom-config.json'
  })

  ct.end()
})

t.test('#run - mix of self-referencing from process.env to file', ct => {
  process.env.FOO = 'bar'

  src = `# .env
FOO="$\{FOO:-start}-suffix1"
FOO="$\{FOO}-suffix2"
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    FOO: 'bar'
  })

  ct.end()
})

t.test('#run - mix of self-referencing from process.env to file example 2', ct => {
  process.env.BAR = 'bar'

  src = `# .env
FOO="$\{BAR:-start}-suffix1"
FOO="$\{FOO}-suffix2"
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    FOO: 'bar-suffix1-suffix2'
  })

  ct.end()
})

t.test('#run - undefined src', ct => {
  const { parsed } = new Parse(undefined).run()

  ct.same(parsed, {})

  ct.end()
})

t.test('#run - reverse ordered expansion not possible (and never should be. see bash and docker-compose behavior)', ct => {
  src = `# .env
# https://github.com/motdotla/dotenv-expand/issues/123
FIRST_PAGE_URL=$\{PROJECT_PUBLIC_HOST}/first-page
MOCK_SERVER_HOST=http://localhost:$\{MOCK_SERVER_PORT}
MOCK_SERVER_PORT=8090
PROJECT_PUBLIC_HOST=$\{MOCK_SERVER_HOST}
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    FIRST_PAGE_URL: '/first-page',
    MOCK_SERVER_HOST: 'http://localhost:',
    MOCK_SERVER_PORT: '8090',
    PROJECT_PUBLIC_HOST: 'http://localhost:'
  })

  ct.end()
})

t.test('#run - expansion affecting vite', ct => {
  src = `# .env
# https://github.com/motdotla/dotenv-expand/issues/124
SOURCE=12345
EXPANDED=ab-$SOURCE-cd-ef-gh
`

  const { parsed } = new Parse(src, privateKey).run()

  ct.same(parsed, {
    SOURCE: '12345',
    EXPANDED: 'ab-12345-cd-ef-gh'
  })

  ct.end()
})
