function filepaths (envFile = '.env') {
  if (!Array.isArray(envFile)) {
    return [envFile]
  }

  return envFile
}

module.exports = filepaths
