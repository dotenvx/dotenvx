const path = require('path')
const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

function nextLib (stubs = {}) {
  return proxyquire('../../src/lib/next', {
    './main': stubs.dotenvx || { config: sinon.stub().returns({ parsed: { HELLO: 'World' } }) },
    './next/webpack-plugin': stubs.webpackPlugin || {
      DotenvxNextWebpackPlugin: class DotenvxNextWebpackPlugin {
        constructor (options) {
          this.options = options
        }
      }
    },
    './next/turbopack-inject': stubs.turbopack || {
      activateTurbopackInjection: sinon.stub()
    }
  })
}

t.beforeEach(() => {
  sinon.restore()
  process.env = {}
})

t.test('withDotenvx loads existing .env files and installs webpack plugin', async t => {
  const dotenvx = { config: sinon.stub().returns({ parsed: { HELLO: 'World' } }) }
  const { withDotenvx } = nextLib({ dotenvx })
  const dir = t.testdir({
    '.env': 'HELLO=World\n'
  })

  const wrapped = withDotenvx({}, { envDir: dir })
  const config = await wrapped('phase-test', { defaultConfig: {} })
  const webpackConfig = config.webpack({ plugins: [], resolve: {} }, {})

  t.same(dotenvx.config.firstCall.args[0], {
    overload: true,
    quiet: true,
    path: [path.join(dir, '.env')]
  })
  t.equal(webpackConfig.plugins.length, 1)
  t.equal(webpackConfig.plugins[0].options.env.HELLO, 'World')
  t.match(webpackConfig.resolve.alias['@next/env'], /src\/lib\/next\/env\.js$/)
})

t.test('withDotenvx preserves existing webpack config', async t => {
  const { withDotenvx } = nextLib()
  const nextConfig = {
    webpack: sinon.stub().callsFake((config) => {
      config.custom = true
      return config
    })
  }

  const config = await withDotenvx(nextConfig)('phase-test', { defaultConfig: {} })
  const webpackConfig = config.webpack({ plugins: [] }, {})

  t.equal(nextConfig.webpack.called, true)
  t.equal(webpackConfig.custom, true)
  t.equal(webpackConfig.plugins.length, 1)
})

t.test('withDotenvx activates turbopack injection when turbopack env is present', async t => {
  process.env.TURBOPACK = '1'
  const turbopack = { activateTurbopackInjection: sinon.stub() }
  const { withDotenvx } = nextLib({ turbopack })
  const dir = t.testdir({
    '.env': 'HELLO=World\n'
  })

  const config = await withDotenvx({}, { envDir: dir })('phase-test', { defaultConfig: {} })
  const webpackConfig = config.webpack({ plugins: [] }, {})

  t.equal(turbopack.activateTurbopackInjection.calledWith({ HELLO: 'World' }), true)
  t.equal(webpackConfig.plugins.length, 0)
})
