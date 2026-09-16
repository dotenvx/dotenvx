// Keep the existing envFile option attribute and parsing behavior for both
// spellings, including mixed repeated flags. Only --file is advertised.
function configureFileOptions (command) {
  const legacy = command.options.find(option => option.long === '--env-file')
  if (legacy && !command.options.some(option => option.long === '--file')) {
    const index = command.options.indexOf(legacy)
    const visible = command.createOption(legacy.flags.replace('--env-file', '--file'), legacy.description)
    visible.attributeName = () => legacy.attributeName()
    if (legacy.parseArg) visible.argParser(legacy.parseArg)
    if (legacy.defaultValue !== undefined) visible.default(legacy.defaultValue, legacy.defaultValueDescription)
    legacy.short = undefined
    legacy.flags = legacy.flags.replace(/^-f,?\s*/, '')
    legacy.hideHelp()
    command.addOption(visible)
    command.options.pop()
    command.options.splice(index, 0, visible)
  }
  for (const child of command.commands) configureFileOptions(child)
  return command
}

module.exports = configureFileOptions
