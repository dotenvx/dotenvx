const { spawn } = require('child_process')
const path = require('path')

const { confStore } = require('../../shared/store')

const chalk = require('chalk')
const semver = require('semver')
const RemoteVersion = require('./remoteVersion')

const ONE_DAY = 1000 * 60 * 60 * 24

class UpdateNotifier {
  constructor (options = {}) {
    this.options = options
    options.pkg = options.pkg || {}
    options.distTag = options.distTag || 'latest'

    // Reduce pkg to the essential keys. with fallback to deprecated options
    // TODO: Remove deprecated options at some point far into the future
    options.pkg = {
      name: options.pkg.name || options.packageName,
      version: options.pkg.version || options.packageVersion
    }

    if (!options.pkg.name || !options.pkg.version) {
      throw new Error('pkg.name and pkg.version required')
    }

    this.packageName = options.pkg.name
    this.packageVersion = options.pkg.version
    this.updateCheckInterval = typeof options.updateCheckInterval === 'number' ? options.updateCheckInterval : ONE_DAY
  }

  check () {
    this.update = confStore.get('update-notifier-update')

    if (this.update) {
      // Use the real latest version instead of the cached one
      this.update.current = this.packageVersion

      // Clear cached information
      confStore.delete('update-notifier-update')
    }

    // Only check for updates on a set interval
    if (Date.now() - confStore.get('update-notifier-lastUpdateCheck') < this.updateCheckInterval) {
      return
    }

    // Spawn a detached process, passing the options as an environment property
    spawn(process.execPath, [path.join(__dirname, './updateNotifier/check.js'), JSON.stringify(this.options)], {
      detached: true,
      stdio: 'ignore'
    }).unref()
  }

  async fetchInfo () {
    const remoteVersion = await RemoteVersion().run() // example: 0.22.0

    return {
      latest: remoteVersion,
      current: this.packageVersion,
      isOutdated: semver.gt(remoteVersion, this.packageVersion),
      name: this.packageName
    }
  }
}

module.exports = options => {
  const updateNotifier = new UpdateNotifier(options)
  updateNotifier.check()
  return updateNotifier
}

module.exports.UpdateNotifier = UpdateNotifier
