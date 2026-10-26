const fs = require('fs')
const path = require('path')

// Lock the pathname, not the inode: write-file-atomic replaces the key file.
async function withKeyFileLock (filepath, operation) {
  const absolute = path.resolve(filepath)
  let canonical
  try {
    canonical = await fs.promises.realpath(absolute)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    canonical = path.join(await fs.promises.realpath(path.dirname(absolute)), path.basename(absolute))
  }
  const lockpath = `${canonical}.lock`
  try {
    await fs.promises.mkdir(lockpath)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    const locked = new Error(`[KEY_FILE_LOCKED] ${filepath} is locked by another encrypt command. Retry after it finishes. If it was interrupted, remove ${lockpath} only after confirming no encrypt command is running.`)
    locked.code = 'KEY_FILE_LOCKED'
    throw locked
  }

  try {
    return await operation()
  } finally {
    // Never expire locks by age: a slow or paused writer still owns its keys.
    await fs.promises.rmdir(lockpath)
  }
}

module.exports = withKeyFileLock
