const fs = require('fs')

const FORMATS = ['.env*', '!.env.vault']
const logger = require('./../../shared/logger')

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
        logger.info(`creating ${this.filename}`)

        fs.writeFileSync(this.filename, '')
      } else {
        return
      }
    }

    const lines = fs.readFileSync(this.filename, 'utf8').split(/\r?\n/)
    this.formats.forEach(format => {
      if (!lines.includes(format.trim())) {
        logger.info(`appending ${format} to ${this.filename}`)

        this.append(format)
      }
    })
  }
}

class Git {
  run () {
    logger.verbose('appending to .gitignore')
    new Generic('.gitignore', true).run()
  }
}

class Docker {
  run () {
    logger.verbose('appending to .dockerignore (if existing)')
    new Generic('.dockerignore').run()
  }
}

class Npm {
  run () {
    logger.verbose('appending to .npmignore (if existing)')
    new Generic('.npmignore').run()
  }
}

class Vercel {
  run () {
    logger.verbose('appending to .vercelignore (if existing)')
    new Generic('.vercelignore').run()
  }
}

function gitignore () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  new Git().run()
  new Docker().run()
  new Npm().run()
  new Vercel().run()

  logger.success('done')
}

module.exports = gitignore
