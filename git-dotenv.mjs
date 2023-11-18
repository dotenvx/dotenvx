#!/usr/bin/env node

import { spawn } from 'child_process'
import { Command } from 'commander'
import dotenv from 'dotenv'
import { readPackageSync } from 'read-pkg'

const packageJson = readPackageSync()

const program = new Command()

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)

program.command('encrypt')
  .description('encrypt something')
  .action((str, options) => {
    console.log('encrypted!')
  })

program.command('decrypt')
  .description('decrypt something')
  .action((str, options) => {
    console.log('decrypted!')
  })

program.command('run')
  .description('Load env from encrypted .env.vault or .env')
  .action(() => {
    // Extract command and arguments after '--'
    const commandIndex = process.argv.indexOf('--')
    if (commandIndex === -1 || commandIndex === process.argv.length - 1) {
      console.error('Error: No command provided after --.')
      process.exit(1)
    }

    const command = process.argv[commandIndex + 1]
    const args = process.argv.slice(commandIndex + 2)

    dotenv.config() // load from .env of .env.vault file

    const env = {} // save for overrides

    executeCommand(command, args, env)
  })

program.parse(process.argv)

function executeCommand (command, args, env) {
  const subprocess = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env }
  })

  subprocess.on('close', (code) => {
    process.exit(code)
  })

  subprocess.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })
}
