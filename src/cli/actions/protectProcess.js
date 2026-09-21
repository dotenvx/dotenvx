const { once } = require('events')
const { check, exempt } = require('./protectStdin')
const { logger } = require('../../shared/logger')
const createProtectSpinner = require('../../lib/helpers/createProtectSpinner')
const logProtectedFiles = require('../../lib/helpers/logProtectedFiles')

// Git's v2 filter protocol frames every message and blob with pkt-line lengths.
async function * packets (input) {
  let buffer = Buffer.alloc(0)
  for await (const chunk of input) {
    buffer = Buffer.concat([buffer, chunk])
    while (buffer.length >= 4) {
      const header = buffer.subarray(0, 4).toString('ascii')
      if (!/^[0-9a-fA-F]{4}$/.test(header)) throw new Error('Invalid Git filter packet')
      const length = parseInt(header, 16)
      if (length !== 0 && (length < 4 || length > 65520)) throw new Error('Invalid Git filter packet length')
      if (buffer.length < (length || 4)) break
      const packet = length ? buffer.subarray(4, length) : null
      buffer = buffer.subarray(length || 4)
      yield packet
    }
  }
  if (buffer.length) throw new Error('Incomplete Git filter packet')
}

module.exports = async function protectProcess (options = {}) {
  let spinner
  let started = false
  let failed = false
  let activeRequest = false
  let reported = false
  const checkedFiles = new Set()
  const stop = () => { if (spinner) spinner.stop() }
  const finish = () => {
    stop()
    if (spinner && !failed && !activeRequest && !reported) {
      reported = true
      logProtectedFiles(checkedFiles)
    }
  }
  // Git may terminate an idle filter with SIGTERM instead of closing stdin.
  const onExit = code => { if (code === 0 || code === 143) finish() }
  process.once('exit', onExit)
  const reader = packets(process.stdin)
  const write = async data => {
    if (!process.stdout.write(data)) await once(process.stdout, 'drain')
  }
  const packet = async data => {
    if (data === null) return write('0000')
    const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data)
    await write(Buffer.from((bytes.length + 4).toString(16).padStart(4, '0')))
    await write(bytes)
  }
  const list = async (allowEOF = false) => {
    const result = []
    while (true) {
      const item = await reader.next()
      if (item.done) {
        if (allowEOF && !result.length) return null
        throw new Error('Incomplete Git filter request')
      }
      if (item.value === null) return result
      result.push(item.value)
    }
  }
  const lines = entries => entries.map(entry => entry.toString('utf8').replace(/\n$/, ''))
  try {
    const hello = lines(await list())
    if (hello[0] !== 'git-filter-client' || !hello.includes('version=2')) throw new Error('Unsupported Git filter handshake')
    await packet('git-filter-server\n')
    await packet('version=2\n')
    await packet(null)
    const capabilities = lines(await list())
    if (!capabilities.includes('capability=clean')) throw new Error('Git filter requires clean capability')
    await packet('capability=clean\n')
    const smudge = capabilities.includes('capability=smudge')
    if (smudge) await packet('capability=smudge\n')
    await packet(null)
    while (true) {
      const headers = await list(true)
      if (headers === null) return
      activeRequest = true
      const fields = new Map(lines(headers).map(line => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1)]
      }))
      const command = fields.get('command')
      if ((command !== 'clean' && !(smudge && command === 'smudge')) || !fields.has('pathname')) throw new Error('Invalid Git filter request')
      if (command === 'clean' && !started) {
        started = true
        spinner = await createProtectSpinner(options)
      }
      const content = Buffer.concat(await list())
      // Checkout must remain a byte-for-byte passthrough, even for existing plaintext history.
      if (command === 'clean' && !check(fields.get('pathname'), content, stop)) {
        failed = true
        await packet('status=error\n')
        await packet(null)
        activeRequest = false
        continue
      }
      await packet('status=success\n')
      await packet(null)
      for (let offset = 0; offset < content.length; offset += 65516) {
        await packet(content.subarray(offset, offset + 65516))
      }
      await packet(null)
      await packet(null)
      if (command === 'clean' && !exempt(fields.get('pathname'))) checkedFiles.add(fields.get('pathname'))
      activeRequest = false
    }
  } catch {
    failed = true
    stop()
    // Never include malformed protocol data: it may contain secret contents.
    logger.error('Git protection filter protocol failed')
    process.exitCode = 1
    process.stdin.destroy()
  } finally {
    finish()
    process.removeListener('exit', onExit)
  }
}
