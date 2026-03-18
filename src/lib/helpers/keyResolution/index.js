module.exports = {
  keyNames: require('./keyNames'),
  keyValues: require('./keyValues'),

  // public
  publicKeyValue: require('./publicKeyValue'),

  // private
  privateKeyValue: require('./privateKeyValue'),

  // other
  readProcessKey: require('./readProcessKey'),
  readFileKey: require('./readFileKey'),
  guessPrivateKeyFilename: require('./../guessPrivateKeyFilename'),
  dotenvPrivateKeyNames: require('./../dotenvPrivateKeyNames')
}
