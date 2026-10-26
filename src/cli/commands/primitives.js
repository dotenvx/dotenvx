const commandAction = require('../commandAction')

module.exports = function primitives (command) {
  command
    .description('standalone primitive operations')
    .action(function () { this.help() })

  command.command('redact')
    .description('replace secret strings in text with [REDACTED]')
    .argument('[text]', 'text to redact')
    .requiredOption('-s, --secret <values...>', 'literal secrets to redact')
    .option('--stdin', 'read text from stdin')
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/redact')))

  command.command('keypair')
    .description('generate or restore a keypair and print JSON')
    .argument('[privateKey]', 'hex-encoded private key to restore')
    .option('--stdin', 'read the private key from stdin')
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/keypair')))

  command.command('derive')
    .description('derive and print a public key from a private key')
    .argument('[privateKey]', 'hex-encoded private key')
    .option('--stdin', 'read the private key from stdin')
    .allowExcessArguments(false)
    .action(commandAction(require('../actions/primitives/derive')))
}
