module.exports = {
  keyNames: require('./keyNames'),
  keyValues: require('./keyValues'),

  // public
  publicKeyValue: require('./publicKeyValue'),

  // private
  // private keys are resolved via keyValues()

  // other
  readProcessKey: require('./readProcessKey'),
  readFileKey: require('./readFileKey'),
  guessPrivateKeyFilename: require('./../guessPrivateKeyFilename'),
  dotenvPrivateKeyNames: require('./../dotenvPrivateKeyNames')
}
