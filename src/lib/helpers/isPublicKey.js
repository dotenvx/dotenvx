module.exports = function isPublicKey (name) {
  return name.includes('PUBLIC') || name.startsWith('VITE')
}
