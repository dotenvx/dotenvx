const Ops = require('./../lib/extensions/ops')

class Session {
  constructor () {
    this.ops = new Ops()
    this.opsStatus = this.ops.status()
  }

  //
  // ops status helpers
  //
  opsOn () {
    return this.opsStatus === 'on'
  }
}

module.exports = Session
