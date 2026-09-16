module.exports = function isValidEmail (value) {
  if (value.length > 254 || /\s/.test(value)) return false
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i.test(local)) return false
  const labels = domain.split('.')
  return labels.length > 1 &&
    labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(labels[labels.length - 1])
}
