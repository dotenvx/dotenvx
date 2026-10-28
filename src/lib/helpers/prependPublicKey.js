function prependPublicKey (publicKeyName, publicKey, filename, relativeFilepath = '.env.keys') {
  const comment = relativeFilepath === '.env.keys'
    ? ''
    : ` # -fk ${relativeFilepath}`

  return [
    '# ◈ encrypted with Dotenvx',
    `${publicKeyName}="${publicKey}"${comment}`,
    '',
    `# ${filename}`
  ].join('\n')
}

module.exports = prependPublicKey
