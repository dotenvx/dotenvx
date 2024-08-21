function truncate (str, showChar = 7) {
  const visiblePart = str.slice(0, showChar)
  return visiblePart + '…'
}

module.exports = truncate
