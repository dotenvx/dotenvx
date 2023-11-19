const path = require('path')
const { spawn } = require('child_process')

// resolve path based on current running process location
const resolvePath = function (filepath) {
  return path.resolve(process.cwd(), filepath)
}

const executeCommand = function (command, args, env) {
  const subprocess = spawn(command, args, {
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

module.exports = {
  resolvePath,
  executeCommand
}
