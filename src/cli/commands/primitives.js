const { derive, keypair } = require('@dotenvx/primitives')
const commandAction = require('../commandAction')
const catchAndLog = require('../../lib/helpers/catchAndLog')

function output (operation, required = false) {
  return commandAction(async function (privateKey) {
    try {
      if (this.opts().stdin) {
        if (privateKey !== undefined) throw new Error('Cannot combine a private key argument with --stdin')
        process.stdin.setEncoding('utf8')
        let input = ''
        for await (const chunk of process.stdin) input += chunk
        privateKey = input.trim()
        if (!privateKey) throw new Error('Expected a private key on stdin')
      }
      if (required && privateKey === undefined) throw new Error('Provide a private key argument or use --stdin')
      if (privateKey !== undefined && (privateKey.length !== 64 || !/^[a-f0-9]{64}$/i.test(privateKey))) throw new Error('Expected one 64-character hex private key')
      const result = operation(privateKey)
      console.log(typeof result === 'string' ? result : JSON.stringify(result))
      return { exitCode: 0 }
    } catch (error) {
      catchAndLog(error)
      return { exitCode: 1 }
    }
  })
}

module.exports = function primitives (command) {
  command
    .description('standalone primitives without env file reads or writes')
    .action(function () { this.help() })

  command.command('keypair')
    .description('generate or restore a key pair and print JSON')
    .argument('[privateKey]', 'hex-encoded private key to restore')
    .option('--stdin', 'read the private key from stdin')
    .allowExcessArguments(false)
    .action(output(keypair))

  command.command('derive')
    .description('derive and print a public key from a private key')
    .argument('[privateKey]', 'hex-encoded private key')
    .option('--stdin', 'read the private key from stdin')
    .allowExcessArguments(false)
    .action(output(derive, true))
}
