const nextjs = require('../conventions/nextjs')
const mono = require('../conventions/mono')

function conventions (convention) {
  switch (convention) {
    case 'nextjs':
      return nextjs()
    case 'mono':
      return mono()
    default:
      throw new Error(`INVALID_CONVENTION: '${convention}'. permitted conventions: ['nextjs', 'mono']`)
  }
}

module.exports = conventions
