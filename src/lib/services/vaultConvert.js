const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const DotenvKeys = require('./../helpers/dotenvKeys')
const DotenvVault = require('./../helpers/dotenvVault')

const ENCODING = 'utf8'

const findEnvFiles = require('../helpers/findEnvFiles')

class VaultConvert {
  constructor (directory = '.', envFile) {
    this.directory = directory
    this.envFile = envFile // || findEnvFiles(directory)
    // calculated
    //this.envKeysFilepath = path.resolve(this.directory, '.env.keys')
    //this.envVaultFilepath = path.resolve(this.directory, '.env.vault')
  }

  run () {
    // implement
  }
}

module.exports = VaultConvert
