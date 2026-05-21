const Enquirer = require('enquirer')

const enquirer = new Enquirer()

function choicesForSelect (choices) {
  return choices.map(choice => {
    if (typeof choice === 'string') return choice

    return {
      name: choice.value,
      message: choice.name || choice.value
    }
  })
}

function enquirerOptions (context = {}) {
  const options = {
    // Enquirer names the render stream stdout; use stderr so stdout stays machine-readable.
    stdout: context.output || process.stderr
  }

  if (context.input) {
    options.stdin = context.input
  }

  return options
}

async function select ({ message, choices }, context) {
  const answer = await enquirer.prompt({
    type: 'select',
    name: 'value',
    message,
    choices: choicesForSelect(choices),
    ...enquirerOptions(context)
  })

  return answer.value
}

module.exports = {
  select
}
