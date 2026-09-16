const t = require('tap')
const { Command } = require('@dotenvx/tooling')
const configureFileOptions = require('../../../src/cli/commands/fileOptions')

function command () {
  return configureFileOptions(new Command().exitOverride()
    .option('-f, --env-file <path>', 'env files', (value, previous) => previous.concat(value.split(',')), []))
}

t.test('file spellings share the original attribute and repeated value parsing', t => {
  for (const flag of ['--file', '--env-file', '-f']) {
    const cmd = command().parse(['node', 'test', flag, '.env.production,.env'])
    t.same(cmd.opts(), { envFile: ['.env.production', '.env'] })
  }
  const cmd = command().parse(['node', 'test', '--file=.env.a', '--env-file', '.env.b', '-f', '.env.c'])
  t.same(cmd.opts(), { envFile: ['.env.a', '.env.b', '.env.c'] })
  t.match(cmd.helpInformation(), '-f, --file <path>')
  t.notMatch(cmd.helpInformation(), '--env-file')
  t.end()
})

t.test('nested commands retain scalar and variadic options and defaults', t => {
  const root = new Command().exitOverride()
  const scalar = root.command('scalar').option('-f, --env-file <path>', 'env file', '.env')
  const variadic = root.command('variadic').option('-f, --env-file <paths...>', 'env files', '.env*')
  configureFileOptions(root)
  t.same(scalar.opts(), { envFile: '.env' })
  scalar.parse(['node', 'scalar', '--file', '.env.production'])
  t.same(scalar.opts(), { envFile: '.env.production' })
  variadic.parse(['node', 'variadic', '--env-file', '.env.a', '.env.b'])
  t.same(variadic.opts(), { envFile: ['.env.a', '.env.b'] })
  t.notMatch(variadic.helpInformation(), '--env-file')
  t.end()
})
