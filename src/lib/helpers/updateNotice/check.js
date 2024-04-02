(async () => {
  const store = require('../../../shared/store')
  const RemoteVersion = require('../remoteVersion')
  const packageJson = require('../packageJson')
  const semver = require('semver')

  // Exit process when offline
  setTimeout(process.exit, 1000 * 30)

  const remoteVersion = await new RemoteVersion().run()

  // set DOTENVX_LATEST_VERSION_LAST_CHECKED (for use with interval (one day) checks)
  store.setLatestVersionLastChecked(Date.now())

  const localVersion = packageJson.version
  const updateAvailable = semver.gt(remoteVersion, localVersion)

  // if update is available then set DOTENVX_LATEST_VERSION
  if (updateAvailable) {
    store.setLatestVersion(remoteVersion)
  }

  // Call process exit explicitly to terminate the child process,
  // otherwise the child process will run forever, according to the Node.js docs
  process.exit()
})().catch(error => {
  console.error(error)
  process.exit(1)
})
