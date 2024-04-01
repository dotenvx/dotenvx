const { UpdateNotifier } = require('../updateNotifier')
const { confStore } = require('../../shared/store')

const options = JSON.parse(process.argv[2])

const updateNotifier = new UpdateNotifier(options);

(async () => {
  // Exit process when offline
  setTimeout(process.exit, 1000 * 30)

  const update = await updateNotifier.fetchInfo()

  // Only update the last update check time on success
  confStore.set('update-notifier-lastUpdateCheck', Date.now())

  if (update.isOutdated) {
    confStore.set('update-notifier-update', update)
  }

  // Call process exit explicitly to terminate the child process,
  // otherwise the child process will run forever, according to the Node.js docs
  process.exit()
})().catch(error => {
  console.error(error)
  process.exit(1)
})
