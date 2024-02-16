const globSync = require('glob').globSync

// options is optional
function ls () {
  const envFiles = globSync('**/.env*', { ignore: 'node_modules/**' })

  console.log(envFiles)
}

module.exports = ls
