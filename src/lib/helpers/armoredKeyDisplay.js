function armoredKeyDisplay (publicKey) {
  if (!publicKey) return ''

  const prefix = String(publicKey).slice(0, 6).toUpperCase()
  if (prefix.length <= 3) return prefix

  return `${prefix.slice(0, 3)} ${prefix.slice(3)}`
}

module.exports = armoredKeyDisplay
