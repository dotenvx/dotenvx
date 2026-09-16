// Source installs can resolve dependencies beside the original preload. The
// executable build replaces this module with the bundled, standalone script.
module.exports = `require(${JSON.stringify(require.resolve('./proxyPreload'))})\n`
