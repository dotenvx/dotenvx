const { publickeys } = require('@dotenvx/primitives')
const armoredKeyDisplay = require('./armoredKeyDisplay')

const names = {
  native: { darwin: 'Keychain ⛉', win32: 'Credential Manager ⛉', linux: 'Secret Service ⛉' }[process.platform] || 'Local ⛉',
  macosKeychain: 'Keychain ⛉',
  windowsCredentialManager: 'Credential Manager ⛉',
  linuxSecretService: 'Secret Service ⛉',
  file: '.env.keys ⛉',
  '.env.keys': '.env.keys ⛉',
  environment: 'Env ⛉',
  onepassword: '1Password ⛊',
  bitwarden: 'Bitwarden ⛊',
  armor: 'Armor ⛨',
  armored: 'Armor ⛨'
}

module.exports = function keySummary (filepaths, rows) {
  const sources = new Set()
  const files = filepaths.map(filepath => {
    const row = rows.find(row => (row.envFilepath || row.filepath) === filepath)
    if (!row) return filepath
    const keys = publickeys(row.envSrc || row.src || '')
    for (const key of keys) {
      const source = row.keySources && row.keySources[key]
      sources.add(names[source] || source || 'source unknown')
    }
    return keys.length ? `${filepath} (${keys.map(armoredKeyDisplay).join('+')})` : filepath
  })
  return { files, suffix: sources.size ? ` via ${[...sources].join(',')}` : '' }
}
