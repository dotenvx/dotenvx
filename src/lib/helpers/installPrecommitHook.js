const fsx = require('./fsx')
const path = require('path')
const Errors = require('./errors')

const HOOK_SCRIPT = `#!/bin/sh

if command -v dotenvx 2>&1 >/dev/null
then
  dotenvx precommit
elif npx dotenvx -V >/dev/null 2>&1
then
  npx dotenvx precommit
else
  if [ -t 2 ]; then
    RED="$(printf '\\033[31m')"
    RESET="$(printf '\\033[0m')"
  else
    RED=""
    RESET=""
  fi

  printf "%s☠ 'dotenvx precommit' command not found (.git/hooks/precommit) fix: [curl -sfS https://dotenvx.sh | sh]%s\n" "$RED" "$RESET" >&2
  exit 1
fi
`

class InstallPrecommitHook {
  constructor () {
    this.hookPath = path.join('.git', 'hooks', 'pre-commit')
  }

  run () {
    let successMessage

    try {
      // Check if the pre-commit file already exists
      if (this._exists()) {
        const currentHook = this._currentHook()

        // Check if 'dotenvx precommit' already exists in the file
        if (currentHook.includes('dotenvx precommit') || currentHook.includes('dotenvx ext precommit')) {
          // do nothing
          successMessage = `▣ dotenvx precommit exists [${this.hookPath}]`
        } else {
          this._appendHook()
          successMessage = `▣ dotenvx precommit appended [${this.hookPath}]`
        }
      } else {
        this._createHook()
        successMessage = `▣ dotenvx precommit installed [${this.hookPath}]`
      }

      return {
        successMessage
      }
    } catch (err) {
      throw new Errors({ error: err }).precommitHookModifyFailed()
    }
  }

  _exists () {
    return fsx.existsSync(this.hookPath)
  }

  _currentHook () {
    return fsx.readFileXSync(this.hookPath)
  }

  _createHook () {
    // If the pre-commit file doesn't exist, create a new one with the hookScript
    fsx.writeFileXSync(this.hookPath, HOOK_SCRIPT)
    fsx.chmodSync(this.hookPath, '755') // Make the file executable
  }

  _appendHook () {
    // Append 'dotenvx precommit' to the existing file
    fsx.appendFileSync(this.hookPath, '\n' + HOOK_SCRIPT)
  }
}

module.exports = InstallPrecommitHook
