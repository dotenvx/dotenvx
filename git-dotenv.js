const packageJson = require('./package.json')

const { Command } = require('commander')
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

program.parse()
