const path = require('path')
const { spawn } = require('child_process')

// resolve path based on current running process location
const resolvePath = function (filepath) {
  return path.resolve(process.cwd(), filepath)
}

const executeCommand = function (subCommand, env) {
  const subprocess = spawn(subCommand[0], subCommand.slice(1), {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env }
  })

  subprocess.on('close', (code) => {
    process.exit(code)
  })

  subprocess.on('error', (_err) => {
    process.exit(1)
  })
}

function pluralize (word, count) {
  // simple pluralization: add 's' at the end
  if (count === 0 || count > 1) {
    return word + 's'
  } else {
    return word
  }
}

module.exports = {
  resolvePath,
  executeCommand,
  pluralize
}
