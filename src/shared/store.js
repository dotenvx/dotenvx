const Conf = require('conf')

const store = new Conf({
  projectName: 'dotenvx',
  projectSuffix: '' // https://github.com/sindresorhus/conf/tree/v10.2.0#projectsuffix
})

module.exports = store
