const { Command } = require('commander')

function login() {
  console.log('Logging into hub...')
}

const hub = new Command('hub')

hub
  .description('Interact with the hub')

hub
  .command('login')
  .description('Login to the hub')
  .action(function () {
    console.log('logging into hub')
  })

module.exports = hub
