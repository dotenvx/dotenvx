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
          "fs": {"encrypted":false},
          "stdio": {"redacted":false}
        },
        "API_KEY": {
          "env": {"type":"string","required":true,"strict":true},
          "fs": {"encrypted":true},
          "stdio": {"redacted":true}
        }
      }
    }' \\
    --env '{"PORT":"3000","API_KEY":"example-secret"}'

Output:
  {"checked":{"PORT":"3000","API_KEY":"[REDACTED]"},"errors":[]}

  --policy takes the resolved JSON returned by primitives policy.
  --env supplies the values to check; no files or shell environment are loaded.
  check validates env rules and applies stdio redaction; fs rules describe storage policy.
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
    .description('resolve policy source for selected files and print JSON')
    .requiredOption('--source <text>', 'policy source text in Dotenvxfile syntax')
    .option('--file <paths>', 'comma-separated env files, first file wins (default: .env)')
    .addHelpText('after', `
Examples:
  Resolve inline policy source:
    dotenvx primitives policy --source 'env "PORT", type: "port", required: true'

  Read source from a file using your shell and select production rules:
    dotenvx primitives policy --source "$(cat Dotenvxfile)" --file .env.production

  --source is policy text. --file selects rules; it does not read an env file.
  Output is JSON containing the resolved keys and their policy rules.`)
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
}
