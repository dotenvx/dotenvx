const logger = require('./../../shared/logger')

const Precommit = require('./../../lib/services/precommit')

function precommit () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const precommit = new Precommit(options)
  precommit.run()
}

module.exports = precommit
