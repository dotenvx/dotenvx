// based on "update-notifier" by Sindre Sorhus (https://github.com/sindresorhus/update-notifier)
// licensed under the MIT License (see [license](https://github.com/yeoman/update-notifier/blob/v5.1.0/license) file for details).

'use strict'
const { spawn } = require('child_process')
const path = require('path')

const { confStore } = require('../../shared/store')

const chalk = require('chalk')
const semver = require('semver')
const RemoteVersion = require('./remoteVersion')
const isNpm = require('is-npm')
const isInstalledGlobally = require('is-installed-globally')
const isYarnGlobal = require('is-yarn-global')
const hasYarn = require('has-yarn')
const boxen = require('boxen')
const pupa = require('pupa')

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
    this.shouldNotifyInNpmScript = options.shouldNotifyInNpmScript
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

  notify (options) {
    const suppressForNpm = !this.shouldNotifyInNpmScript && isNpm.isNpmOrYarn
    if (!process.stdout.isTTY || suppressForNpm || !this.update || !semver.gt(this.update.latest, this.update.current)) {
      return this
    }

    options = {
      isGlobal: isInstalledGlobally,
      isYarnGlobal: isYarnGlobal(),
      ...options
    }

    let installCommand
    if (options.isYarnGlobal) {
      installCommand = `yarn global add ${this.packageName}`
    } else if (options.isGlobal) {
      installCommand = `npm i -g ${this.packageName}`
    } else if (hasYarn()) {
      installCommand = `yarn add ${this.packageName}`
    } else {
      installCommand = `npm i ${this.packageName}`
    }

    const defaultTemplate = 'Update available ' + chalk.dim('{currentVersion}') + chalk.reset(' → ') + chalk.green('{latestVersion}') + ' \nRun ' + chalk.cyan('{updateCommand}') + ' to update'
    const template = options.message || defaultTemplate

    options.boxenOptions = options.boxenOptions || {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'yellow',
      borderStyle: 'round'
    }

    const message = boxen(
      pupa(template, {
        packageName: this.packageName,
        currentVersion: this.update.current,
        latestVersion: this.update.latest,
        updateCommand: installCommand
      }),
      options.boxenOptions
    )

    if (options.defer === false) {
      console.error(message)
    } else {
      process.on('exit', () => {
        console.error(message)
      })

      process.on('SIGINT', () => {
        console.error('')
        process.exit()
      })
    }

    return this
  }
}

module.exports = options => {
  const updateNotifier = new UpdateNotifier(options)
  updateNotifier.check()
  return updateNotifier
}

module.exports.UpdateNotifier = UpdateNotifier
