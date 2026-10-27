const commandAction = require('../commandAction')

module.exports = function primitives (command) {
  command
    .description('standalone primitive operations')
    .action(function () { this.help() })

  command.command('check')
    .description('check an environment against a resolved policy and print JSON')
    .requiredOption('--policy <json>', 'resolved policy object as JSON')
    .requiredOption('--env <json>', 'environment names and values as JSON')
    .addHelpText('after', `
Example:
  dotenvx primitives check \\
    --policy '{
      "keys": {
        "PORT": {
          "env": {"type":"port","required":true,"strict":true},
          "stdout": {"redacted":false}
        },
        "API_KEY": {
          "env": {"type":"string","required":true,"strict":true},
          "stdout": {"redacted":true}
        }
      }
    }' \\
    --env '{"PORT":"3000","API_KEY":"example-secret"}'

Output:
  {"checked":{"PORT":"3000","API_KEY":"[REDACTED]"},"errors":[]}

  --policy takes the resolved JSON returned by primitives policy.
  --env supplies the values to check; no files or shell environment are loaded.
  check validates env rules and applies stdout redaction when present.
  Output is JSON containing checked values and errors.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/check')))

  command.command('derive')
    .description('derive and print a public key from a private key')
    .requiredOption('--privateKeyHex <key>', 'hex-encoded private key')
    .addHelpText('after', `
Example:
  dotenvx primitives derive --privateKeyHex 0000000000000000000000000000000000000000000000000000000000000001

Output:
  0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798

  The private key above is for demonstration only. Do not use it for real secrets.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/derive')))

  command.command('injectsummary')
    .description('format and print an environment injection summary')
    .requiredOption('--count <number>', 'number of injected environment variables')
    .option('--files <json>', 'JSON array of filenames or file metadata records', '[]')
    .addHelpText('after', `
Example:
  dotenvx primitives injectsummary --count 2 --files '[
    {
      "filepath": ".env",
      "publicKeys": ["0340dd"],
      "keyCustodies": [".env.keys"]
    },
    {
      "filepath": ".env.production",
      "publicKeys": ["0296a0"],
      "keyCustodies": ["macosKeychain"]
    }
  ]'

  Public keys above are abbreviated for illustration.
  --count counts injected environment variables, not files or keys.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/injectsummary')))

  command.command('keypair')
    .description('generate or restore a keypair and print JSON')
    .option('--privateKey <key>', 'hex-encoded private key to restore')
    .addHelpText('after', `
Examples:
  Generate a new keypair:
    dotenvx primitives keypair

  Restore a keypair from a private key:
    dotenvx primitives keypair --privateKey 0000000000000000000000000000000000000000000000000000000000000001

  The private key above is for demonstration only. Do not use it for real secrets.
  Both commands print JSON containing publicKey and privateKey.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/keypair')))

  command.command('policy')
    .description('resolve environment rules from Dotenvxfile source and print JSON')
    .requiredOption('--source <text>', 'Dotenvxfile source text')
    .option('--file <paths>', 'comma-separated env files, first file wins (default: .env)')
    .addHelpText('after', `
Example:
  dotenvx primitives policy --source 'env "PORT", type: "port", required: true' --file .env.production

  --source is policy text. --file selects rules; it does not read an env file.
  Output contains keys with env and stdout rules.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/policy')))

  command.command('redact')
    .description('replace secret strings in text with [REDACTED]')
    .requiredOption('--text <text>', 'text to redact')
    .requiredOption('--secrets <values...>', 'literal secrets to redact')
    .addHelpText('after', `
Example:
  dotenvx primitives redact --text 'token=abc password=xyz' --secrets abc xyz

Output:
  token=[REDACTED] password=[REDACTED]`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/redact')))

  command.command('storagecheck')
    .description('check stored values against a storage policy and print JSON')
    .requiredOption('--policy <json>', 'resolved storage policy as JSON')
    .requiredOption('--values <json>', 'original stored names and values as JSON')
    .addHelpText('after', `
Example:
  dotenvx primitives storagecheck \\
    --policy '{"keys":{"TOKEN":{"storage":{"type":"encrypted","required":true,"strict":true}}}}' \\
    --values '{"TOKEN":"encrypted:example"}'

  Pass original stored strings, before decryption. No files are read.
  Output is JSON containing checked values and errors, without redaction.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/storagecheck')))

  command.command('storagepolicy')
    .description('resolve storage rules from Dotenvxfile source and print JSON')
    .requiredOption('--source <text>', 'Dotenvxfile source text')
    .option('--file <paths>', 'one env filename (default: .env)')
    .addHelpText('after', `
Example:
  dotenvx primitives storagepolicy --source 'storage "encrypted"\nenv "PORT", storage: "plaintext"' --file .env.production

  --source is policy text. --file selects rules; it does not read an env file.
  Output contains keys with storage rules.`)
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/storagepolicy')))
}
