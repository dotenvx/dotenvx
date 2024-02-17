const treeify = require('object-treeify')

const Ls = require('./../../lib/services/ls')
const ArrayToTree = require('./../../lib/helpers/arrayToTree')
const logger = require('./../../shared/logger')

function ls () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const ls = new Ls()
  const filepaths = ls.run()
  logger.debug(`filepaths: ${JSON.stringify(filepaths)}`)

  const tree = new ArrayToTree(filepaths).run()
  logger.debug(`tree: ${JSON.stringify(tree)}`)

  logger.info(treeify(tree))
}

module.exports = ls
