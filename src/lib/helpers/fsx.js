const fs = require('fs')
const path = require('path')
const writeFileAtomic = require('write-file-atomic')
const Errors = require('./errors')

const ENCODING = 'utf8'
const KEY_FILE_OPTIONS = { encoding: ENCODING, mode: 0o600 }

async function readFileX (filepath, encoding = null) {
  if (!encoding) {
    encoding = ENCODING
  }

  return fs.promises.readFile(filepath, encoding)
}

function readFileXSync (filepath, encoding = null) {
  if (!encoding) {
    encoding = ENCODING
  }

  return fs.readFileSync(filepath, encoding) // utf8 default so it returns a string
}

function writeFileXSync (filepath, str, options = ENCODING) {
  try {
    if (options && options.followSymlinks === false) return writeFileNoFollowSync(filepath, str, options)
    return writeFileAtomic.sync(filepath, str, typeof options === 'string' ? options : { ...options })
  } catch (error) {
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Errors({ filepath }).fileNotWritable()
    }

    throw error
  }
}

function writeFileNoFollowSync (filepath, str, options) {
  const regularFile = () => {
    const stat = fs.lstatSync(filepath, { throwIfNoEntry: false })
    if (stat && !stat.isFile()) throw new Error(`Cannot replace file: expected a regular file (${filepath})`)
    return stat
  }
  const stat = regularFile()
  const { followSymlinks, ...atomicOptions } = options
  if (stat) {
    if (atomicOptions.mode == null) atomicOptions.mode = stat.mode
    if (atomicOptions.chown == null && process.getuid) atomicOptions.chown = { uid: stat.uid, gid: stat.gid }
  }
  // write-file-atomic resolves symlinks. Stage in a private sibling directory so
  // it never resolves the destination, then rename over the directory entry.
  const staging = fs.mkdtempSync(path.join(path.dirname(filepath), '.dotenvx-write-'))
  try {
    const stagedFile = path.join(staging, 'content')
    writeFileAtomic.sync(stagedFile, str, atomicOptions)
    regularFile()
    fs.renameSync(stagedFile, filepath) // rename never follows the destination symlink
  } finally {
    fs.rmSync(staging, { recursive: true, force: true })
  }
}

async function writeFileX (filepath, str, options = ENCODING) {
  try {
    return await writeFileAtomic(filepath, str, typeof options === 'string' ? options : { ...options })
  } catch (error) {
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Errors({ filepath }).fileNotWritable()
    }

    throw error
  }
}

function writeKeyFile (filepath, str) {
  return writeFileX(filepath, str, KEY_FILE_OPTIONS)
}

function writeKeyFileSync (filepath, str) {
  return writeFileXSync(filepath, str, KEY_FILE_OPTIONS)
}

async function exists (filepath) {
  try {
    await fs.promises.access(filepath)
    return true
  } catch (_e) {
    return false
  }
}

const fsx = {
  chmodSync: fs.chmodSync,
  exists,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  appendFileSync: fs.appendFileSync,

  // fsx special commands
  readFileX,
  readFileXSync,
  writeFileX,
  writeFileXSync,
  writeKeyFile,
  writeKeyFileSync
}

module.exports = fsx
