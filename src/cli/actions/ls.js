const treeify = require('object-treeify')

const logger = require('./../../shared/logger')

const Ls = require('./../../lib/services/ls')
const ArrayToTree = require('./../../lib/helpers/arrayToTree')

function ls (directory) {
  logger.debug(`directory: ${directory}`)

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
