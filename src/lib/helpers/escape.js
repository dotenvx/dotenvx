function escape (value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`
}

module.exports = escape
