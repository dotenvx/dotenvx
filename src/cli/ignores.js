const fs = require('fs')

const FORMATS = ['.env*', '!.env.vault']

class Generic {
  constructor (filename, touchFile = false) {
    this.filename = filename
    this.formats = FORMATS
    this.touchFile = touchFile
  }

  append (str) {
    fs.appendFileSync(this.filename, `\n${str}`)
  }

  run () {
    if (!fs.existsSync(this.filename)) {
      if (this.touchFile === true) {
        fs.writeFileSync(this.filename, '')
      } else {
        return
      }
    }

    const lines = fs.readFileSync(this.filename, 'utf8').split(/\r?\n/)
    this.formats.forEach(format => {
      if (!lines.includes(format.trim())) {
        this.append(format)
      }
    })
  }
}

class Git {
  run () {
    new Generic('.gitignore', true).run()
  }
}

class Docker {
  run () {
    new Generic('.dockerignore').run()
  }
}

class Npm {
  run () {
    new Generic('.npmignore').run()
  }
}

class Vercel {
  run () {
    new Generic('.vercelignore').run()
  }
}

class AppendToIgnores {
  run () {
    new Docker().run()
    new Git().run()
    new Npm().run()
    new Vercel().run()
  }
}

module.exports = { AppendToIgnores, Generic }
