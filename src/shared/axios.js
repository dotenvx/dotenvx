try {
  const axios = require('./../../node_modules/axios/dist/node/axios.cjs')
  module.exports = axios
} catch (error) {
  const axios = require('axios')
  module.exports = axios
}
