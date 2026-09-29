const { Enquirer } = require('@dotenvx/tooling')

class CustodySelect extends Enquirer.prompts.Select {
  keypress (input, key = {}) {
    if (key.name === 'escape') return this.cancel(new Error('Cancelled'))
    if (key.name === 'left' && this.options.backValue) {
      this.index = this.choices.findIndex(choice => choice.name === this.options.backValue)
      return this.submit()
    }
    return super.keypress(input, key)
  }

  async render () {
    // Replace the previous step instead of leaving a trail of completed menus.
    if (this.state.submitted) {
      this.clear(this.state.size)
      this.state.prompt = ''
      this.state.size = 0
      return
    }
    return super.render()
  }
}

module.exports = CustodySelect
