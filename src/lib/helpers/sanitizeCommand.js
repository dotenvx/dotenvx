// Characters that could enable command injection
const DANGEROUS_PATTERNS = [
  /;\s*\w+/, // Command chaining with semicolon
  /&&\s*\w+/, // Command chaining with &&
  /\|\|\s*\w+/, // Command chaining with ||
  /[^\\]`/, // Backticks (for command substitution) - but allow escaped ones
  />\s*[/\w]/, // Output redirection
  /<\s*[/\w]/, // Input redirection
  /\|\s*[a-zA-Z]/ // Pipes to commands (but allow | in quotes)
]

// Very dangerous commands that should never be allowed
const BLOCKED_COMMANDS = new Set([
  'rm', 'mv', 'cp', 'dd', 'mkfs', 'fdisk',
  'sudo', 'su', 'chmod', 'chown', 'chgrp',
  'nc', 'netcat', 'curl', 'wget', 'ssh', 'scp',
  'python', 'python3', 'node', 'ruby', 'perl', 'php',
  'bash', 'sh', 'zsh', 'fish', 'csh', 'tcsh',
  'eval', 'exec', 'source', '.',
  'kill', 'killall', 'pkill',
  'mount', 'umount', 'service', 'systemctl'
])

// Maximum allowed command length to prevent buffer overflow
const MAX_COMMAND_LENGTH = 2000

function sanitizeCommand (command) {
  if (!command || typeof command !== 'string') {
    throw new Error('Command must be a non-empty string')
  }

  // Trim whitespace
  command = command.trim()

  // Check length limit
  if (command.length > MAX_COMMAND_LENGTH) {
    throw new Error(`Command too long (${command.length} > ${MAX_COMMAND_LENGTH} characters)`)
  }

  // Parse the command to extract the base command
  const firstWord = command.split(/\s+/)[0]

  // Check if base command is in blocked list
  if (BLOCKED_COMMANDS.has(firstWord)) {
    throw new Error(`Command '${firstWord}' is blocked for security reasons`)
  }

  // Check for dangerous patterns that could enable command injection
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error('Command contains potentially dangerous patterns. Please avoid command chaining, redirection, and unescaped backticks.')
    }
  }

  return command
}

module.exports = sanitizeCommand
