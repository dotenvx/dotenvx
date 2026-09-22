// Only account discovery, native credential-store access, and network settings.
// In particular, do not propagate application secrets or runtime injection flags.
const allowed = new Set([
  'DOTENVX_CONFIG', 'DOTENVX_NO_ARMOR',
  'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA',
  'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS',
  'PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL',
  'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY',
  'NODE_EXTRA_CA_CERTS', 'NODE_USE_SYSTEM_CA', 'SSL_CERT_FILE', 'SSL_CERT_DIR'
])

module.exports = function workerEnvironment (env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) => allowed.has(key.toUpperCase())))
}
