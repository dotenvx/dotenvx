const fs = require('fs')
const path = require('path')

const packageJsonPath = path.join(__dirname, '../../../package.json')

const packageJson = require(packageJsonPath)

module.exports = packageJson
