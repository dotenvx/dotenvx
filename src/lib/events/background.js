const { spawn } = require('child_process')
const Session = require('../../db/session')
const workerEnvironment = require('./workerEnvironment')

// CLI delivery owns no network handles. Credentials are read by the worker.
module.exports = function createBackground (options = {}) {
  if (process.env.DOTENVX_NO_ARMOR === 'true' || options.armor === false || options.noArmor === true) return
  const session = new Session()
  if (!options.token && (!session.on() || !session.username())) return
  // Capture before run loads application environment values.
  const env = workerEnvironment()
  const cwd = process.cwd()
  const args = process.pkg ? [] : [process.argv[1]]
  const token = options.token
  let queue = []
  let closing

  function flush () {
    if (!queue.length) return Promise.resolve()
    const events = queue
    queue = []
    return new Promise(resolve => {
      let child
      let timer
      const done = () => { clearTimeout(timer); resolve() }
      try {
        child = spawn(process.execPath, [...args, '_deliver-events'], {
          cwd, env, detached: true, windowsHide: true, stdio: ['pipe', 'ignore', 'ignore']
        })
        child.on('error', done)
        child.stdin.on('error', done)
        child.unref()
        child.stdin.unref()
        // Only wait for the local pipe write, never worker startup or HTTP.
        timer = setTimeout(() => { child.stdin.destroy(); done() }, 25)
        child.stdin.end(JSON.stringify({ options: { token }, events }), done)
      } catch { done() }
    })
  }

  return {
    write (event, terminal = false) {
      if (closing) return
      if (queue.length >= 256) {
        if (terminal) queue.pop()
        else return
      }
      queue.push(event)
    },
    flush,
    close () {
      if (!closing) closing = flush()
      return closing
    }
  }
}
