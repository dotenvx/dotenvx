// Remove [options] from help text. example:

function removeOptionsHelpParts (lines) {
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(' [options]', '')
  }

  let commandsStart = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'Commands:') {
      commandsStart = i + 1
      break
    }
  }

  if (commandsStart !== -1) {
    const commands = []

    for (let i = commandsStart; i < lines.length; i++) {
      const line = lines[i]
      if (line === '' || line.endsWith(':')) {
        break
      }

      const match = line.match(/^(\s{2})(\S(?:.*\S)?)\s{2,}(\S.*)$/)
      if (match) {
        commands.push({ index: i, indent: match[1], command: match[2], description: match[3] })
      }
    }

    if (commands.length > 0) {
      const maxCommandLength = commands.reduce((max, item) => Math.max(max, item.command.length), 0)
      for (const item of commands) {
        lines[item.index] = `${item.indent}${item.command.padEnd(maxCommandLength + 2)}${item.description}`
      }
    }
  }

  return lines
}

module.exports = removeOptionsHelpParts
