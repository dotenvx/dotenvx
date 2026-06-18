// @ts-check
const PLUGIN_NAME = 'DotenvxNextWebpackPlugin'

const SERVER_RUNTIME_ASSETS = [
  'webpack-runtime.js',
  '../webpack-runtime.js',
  'webpack-api-runtime.js',
  '../webpack-api-runtime.js'
]

const EDGE_RUNTIME_ASSETS = [
  'edge-runtime-webpack.js',
  'webpack-runtime.js',
  '../webpack-runtime.js'
]

class DotenvxNextWebpackPlugin {
  constructor (options) {
    this.options = options
  }

  apply (compiler) {
    const env = this.options.env || {}
    const inlineSnippet = `(function(){if(typeof process!=='undefined'){Object.assign(process.env,${JSON.stringify(env)});}})();`
    const webpack = compiler.webpack || require('webpack')

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap({
        name: PLUGIN_NAME,
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, () => {
        const target = compiler.options.target
        const isEdge = Array.isArray(target)
          ? target.some(t => typeof t === 'string' && t.includes('webworker'))
          : typeof target === 'string' && target.includes('webworker')
        const runtimeNames = isEdge ? EDGE_RUNTIME_ASSETS : SERVER_RUNTIME_ASSETS

        for (const assetName of runtimeNames) {
          if (!compilation.getAsset(assetName)) continue

          compilation.updateAsset(assetName, (origSource) => {
            return new webpack.sources.RawSource([
              inlineSnippet,
              origSource.source().toString()
            ].join('\n'))
          })
        }
      })
    })
  }
}

module.exports = {
  DotenvxNextWebpackPlugin
}
