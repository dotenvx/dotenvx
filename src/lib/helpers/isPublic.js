const PUBLIC_PATTERN = /^public:/

function isPublic (value) {
  return PUBLIC_PATTERN.test(value)
}

module.exports = isPublic
