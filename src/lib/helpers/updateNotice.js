const { spawn } = require('child_process')
const path = require('path')
const semver = require('semver')

const store = require('../../shared/store')
const packageJson = require('./packageJson')

const ONE_DAY = 1000 * 60 * 60 * 24

class UpdateNotice {
  constructor () {
    this.latestVersion = store.getLatestVersion()
    this.latestVersionLastChecked = store.getLatestVersionLastChecked()
    this.packageVersion = packageJson.version
    this.updateCheckInterval = ONE_DAY
    this.update = false
  }

  check () {
    const updateAvailable = semver.gt(this.latestVersion, packageJson.version)

    // Only check for updates on a set interval
    if (Date.now() - this.latestVersionLastChecked < this.updateCheckInterval) {
      return
    }

    if (updateAvailable) {
      this.update = true
    }

    // Spawn a detached process
    spawn(process.execPath, [path.join(__dirname, './updateNotice/check.js')], {
      detached: true,
      stdio: 'ignore'
    }).unref()
  }
}

module.exports = UpdateNotice
