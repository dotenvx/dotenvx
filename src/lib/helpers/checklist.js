const { Enquirer } = require('@dotenvx/tooling')

class Checklist extends Enquirer.prompts.MultiSelect {
  constructor (options) {
    super({
      ...options,
      pointer: '❯',
      choices: [...options.choices, { name: '__submit', message: options.submitLabel, action: true }]
    })
  }

  indicator (choice) {
    if (choice.action) return ' '
    return choice.enabled ? '●' : this.styles.muted('○')
  }

  async renderChoice (choice, index) {
    if (choice.action && typeof this.options.submitLabel === 'function') {
      choice.message = this.options.submitLabel(this.selected.map(item => item.name))
    }
    const line = await super.renderChoice(choice, index)
    return choice.action ? '\n' + line : line
  }

  toggle (choice, enabled) {
    if (choice.action) return choice
    return super.toggle(choice, enabled)
  }

  submit () {
    if (!this.focused || !this.focused.action) return this.space()
    return super.submit()
  }

  get selected () {
    return super.selected.filter(choice => !choice.action)
  }

  format () {
    if (!this.state.submitted || this.state.cancelled) return ''
    return this.selected.map(choice => this.styles.primary(choice.message)).join(', ')
  }
}

module.exports = Checklist
