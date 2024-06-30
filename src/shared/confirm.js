const { ConfirmPrompt } = require('@clack/core')

module.exports = (opts) => {
  return new ConfirmPrompt({
    active: 'Y',
    inactive: 'N',
    initialValue: true,
    render () {
      return `${opts.message} (${this.value ? 'Y/n' : 'y/N'})`
    }
  }).prompt()
}
