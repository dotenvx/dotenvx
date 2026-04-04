const Ops = require('./../lib/extensions/ops')

class Session {
  constructor () {
    this.ops = new Ops()
  }

  //
  // ops status helpers
  //
  async noOps () {
    const status = await this.ops.status()
    return status === 'off'
  }
}

module.exports = Session
