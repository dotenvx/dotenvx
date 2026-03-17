module.exports = {
  findPrivateKey: require('./../findPrivateKey').findPrivateKey,
  findPublicKey: require('./../findPublicKey'),
  smartDotenvPrivateKey: require('./smartDotenvPrivateKey'),
  smartDotenvPublicKey: require('./smartDotenvPublicKey'),
  readProcessEnvKey: require('./readProcessEnvKey'),
  readEnvFileKey: require('./readEnvFileKey'),
  guessKeyNames: require('./guessKeyNames'),
  guessPublicKeyName: require('./guessPublicKeyName'),
  guessPrivateKeyName: require('./guessPrivateKeyName'),
  guessPrivateKeyFilename: require('./../guessPrivateKeyFilename'),
  dotenvPrivateKeyNames: require('./../dotenvPrivateKeyNames')
}
