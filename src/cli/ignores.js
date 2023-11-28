const fs = require('fs')

class AppendToGitIgnore {
  constructor () {
    this.gitignore = '.gitignore'
    this.formats = ['.env*', '!.env.vault', '.flaskenv*']
  }

  append (str) {
    fs.appendFileSync(this.gitignore, `\n${str}`)
  }

  run () {
    if (!fs.existsSync(this.gitignore)) {
      fs.writeFileSync(this.gitignore, '')
    }

    const lines = fs.readFileSync(this.gitignore, 'utf8').split(/\r?\n/)
    this.formats.forEach(format => {
      if (!lines.includes(format.trim())) {
        this.append(format)
      }
    })
  }
}

module.exports = { AppendToGitIgnore }
