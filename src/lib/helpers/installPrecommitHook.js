const fs = require('fs')
const path = require('path')

const HOOK_SCRIPT = `#!/bin/sh

if ! command -v dotenvx &> /dev/null
then
  echo "[dotenvx][precommit] 'dotenvx' command not found"
  echo "[dotenvx][precommit] ? install it with [brew install dotenvx/brew/dotenvx]"
  echo "[dotenvx][precommit] ? other install options [https://dotenvx.com/docs/install]"
  exit 1
fi

dotenvx precommit`

class InstallPrecommitHook {
  constructor () {
    this.hookPath = path.join('.git', 'hooks', 'pre-commit')
  }

  run () {
    let successMessage

    try {
      // Check if the pre-commit file already exists
      if (this._exists()) {
        // Check if 'dotenvx precommit' already exists in the file
        if (this._currentHook().includes('dotenvx precommit')) {
          // do nothing
          successMessage = `dotenvx precommit exists [${this.hookPath}]`
        } else {
          this._appendHook()
          successMessage = `dotenvx precommit appended [${this.hookPath}]`
        }
      } else {
        this._createHook()
        successMessage = `dotenvx precommit installed [${this.hookPath}]`
      }

      return {
        successMessage
      }
    } catch (err) {
      const error = new Error(`failed to modify pre-commit hook: ${err.message}`)
      throw error
    }
  }

  _exists () {
    return fs.existsSync(this.hookPath)
  }

  _currentHook () {
    return fs.readFileSync(this.hookPath, 'utf8')
  }

  _createHook () {
    // If the pre-commit file doesn't exist, create a new one with the hookScript
    fs.writeFileSync(this.hookPath, HOOK_SCRIPT)
    fs.chmodSync(this.hookPath, '755') // Make the file executable
  }

  _appendHook () {
    // Append 'dotenvx precommit' to the existing file
    fs.appendFileSync(this.hookPath, '\n' + HOOK_SCRIPT)
  }
}

module.exports = InstallPrecommitHook
