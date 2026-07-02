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

function clearLastLine (stream) {
  if (stream && typeof stream.moveCursor === 'function' && typeof stream.clearLine === 'function') {
    stream.moveCursor(0, -1)
    stream.clearLine(0)
    return
  }

  if (stream && typeof stream.write === 'function') {
    stream.write('\x1B[1A\x1B[2K')
  }
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

async function password ({ message, prefix, separator }, context) {
  const output = (context && context.output) || process.stderr

  try {
    const answer = await enquirer.prompt({
      type: 'password',
      name: 'value',
      message,
      symbols: {
        prefix: {
          pending: prefix,
          submitted: prefix,
          cancelled: prefix
        },
        separator: {
          pending: separator,
          submitted: separator,
          cancelled: separator
        }
      },
      ...enquirerOptions(context)
    })

    clearLastLine(output)
    return answer.value
  } catch (error) {
    clearLastLine(output)
    const e = new Error('prompt cancelled')
    e.code = 'PROMPT_CANCELLED'
    throw e
  }
}

module.exports = {
  password,
  select
}
