function extractUsernameName (url) {
  // Removing the protocol part and splitting by slashes and colons
  // Removing the protocol part and .git suffix, then splitting by slashes and colons
  const parts = url.replace(/(^\w+:|^)\/\//, '').replace(/\.git$/, '').split(/[/:]/)

  // Extract the 'username/repository' part
  return parts.slice(-2).join('/')
}

module.exports = extractUsernameName
