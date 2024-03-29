// based on "clipboardy" by Sindre Sorhus (https://github.com/sindresorhus/clipboardy)
// licensed under the MIT License (see [license](https://github.com/sindresorhus/clipboardy/blob/v2.3.0/license) file for details).

'use strict'
const isWSL = require('is-wsl')
const termux = require('./clipboardy/termux.js')
const linux = require('./clipboardy/linux.js')
const macos = require('./clipboardy/macos.js')
const windows = require('./clipboardy/windows.js')

const platformLib = (() => {
  switch (process.platform) {
    case 'darwin':
      return macos
    case 'win32':
      return windows
    case 'android':
      if (process.env.PREFIX !== '/data/data/com.termux/files/usr') {
        throw new Error('You need to install Termux for this module to work on Android: https://termux.com')
      }

      return termux
    default:
      // `process.platform === 'linux'` for WSL.
      if (isWSL) {
        return windows
      }

      return linux
  }
})()

exports.write = async text => {
  if (typeof text !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof text}`)
  }

  await platformLib.copy({ input: text })
}

exports.read = async () => platformLib.paste({ stripEof: false })

exports.writeSync = text => {
  if (typeof text !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof text}`)
  }

  platformLib.copySync({ input: text })
}

exports.readSync = () => platformLib.pasteSync({ stripEof: false }).stdout
