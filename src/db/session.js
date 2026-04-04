const Ops = require('./../lib/extensions/ops')
const { logger } = require('./../shared/logger')

class Session {
  constructor () {
    this.ops = new Ops()
  }

  //
  // ops status helpers
  //
  async noOps () {
    const status = await this.ops.status()
    logger.debug(`ops: ${status}`)
    return status === 'off'
  }

  noOpsSync () {
    const status = this.ops.statusSync()
    logger.debug(`ops: ${status}`)
    return status === 'off'
  }
}

module.exports = Session
