const Ops = require('./../lib/extensions/ops')

class Session {
  constructor () {
    this.ops = new Ops()
  }

  //
  // ops status helpers
  //
  async opsOn () {
    const status = await this.ops.status()
    return status === 'on'
  }
}

module.exports = Session
