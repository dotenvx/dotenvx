module.exports = {
  keyNames: require('./keyNames'),
  keyValuesSync: require('./keyValuesSync'),

  // private
  // private keys are resolved via keyValuesSync()

  // other
  readProcessKey: require('./readProcessKey'),
  readFileKey: require('./readFileKey'),
  guessPrivateKeyFilename: require('./../guessPrivateKeyFilename'),
  dotenvPrivateKeyNames: require('./../dotenvPrivateKeyNames')
}
