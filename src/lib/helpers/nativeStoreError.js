// Never attach subprocess errors: their command/output may contain private keys.
function nativeStoreError (message, error, linux = false) {
  const unavailable = error.code === 'ENOENT' || (linux &&
    /org\.freedesktop\.DBus\.Error\.(ServiceUnknown|NoServer)|Cannot autolaunch D-Bus without X11|Failed to connect to socket .*: No such file or directory/.test(String(error.stderr || '')))
  const result = new Error(message)
  result.code = unavailable ? 'NATIVE_UNAVAILABLE' : 'NATIVE_ACCESS_FAILED'
  return result
}

module.exports = nativeStoreError
