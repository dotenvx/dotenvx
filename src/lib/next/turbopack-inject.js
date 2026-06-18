// @ts-check
const fs = require('fs')
const path = require('path')

let injectedTurbopackRuntime = false

function debugLog (...args) {
  if (!process.env.DEBUG_DOTENVX_NEXT) return
  console.log('[dotenvx-next]', ...args)
}

function isInjectedTurbopackRuntime () {
  return injectedTurbopackRuntime
}

function injectDotenvxInitIntoTurbopackRuntime (nextDirPath, env) {
  if (injectedTurbopackRuntime) return

  const serverRuntimeFiles = []
  const edgeWrapperFiles = []

  function walkDir (dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walkDir(entryPath)
      } else if (entry.name === '[turbopack]_runtime.js') {
        serverRuntimeFiles.push(entryPath)
      } else if (entry.name.includes('edge-wrapper') && entry.name.endsWith('.js')) {
        edgeWrapperFiles.push(entryPath)
      }
    }
  }

  walkDir(nextDirPath)

  debugLog(
    `turbopack runtime injection: found ${serverRuntimeFiles.length} server runtime files,`,
    `${edgeWrapperFiles.length} edge wrapper files`
  )

  if (!serverRuntimeFiles.length) return

  injectedTurbopackRuntime = true
  const inlineSnippet = `(function(){if(typeof process!=='undefined'){Object.assign(process.env,${JSON.stringify(env)});}})();`

  function insertIntoSource (origSource) {
    const lines = origSource.split('\n')
    let lastImportIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImportIdx = i
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, inlineSnippet)
      return lines.join('\n')
    }
    return [inlineSnippet, origSource].join('\n')
  }

  for (const runtimeFile of serverRuntimeFiles) {
    const origSource = fs.readFileSync(runtimeFile, 'utf8')
    fs.writeFileSync(runtimeFile, insertIntoSource(origSource))
    debugLog(`injected env into turbopack server runtime: ${runtimeFile}`)
  }

  for (const wrapperFile of edgeWrapperFiles) {
    const origSource = fs.readFileSync(wrapperFile, 'utf8')
    fs.writeFileSync(wrapperFile, insertIntoSource(origSource))
    debugLog(`injected env into turbopack edge wrapper: ${wrapperFile}`)
  }
}

function activateTurbopackInjection (env) {
  debugLog('activating turbopack fs intercept')

  const origWriteFile = fs.promises.writeFile
  fs.promises.writeFile = async function dotenvxPatchedWriteFile (...args) {
    const filePath = args[0].toString()
    debugLog('fs.promises.writeFile:', filePath)

    if (!injectedTurbopackRuntime && filePath.endsWith('/.next/export-detail.json')) {
      const nextDirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      injectDotenvxInitIntoTurbopackRuntime(nextDirPath, env)
    }

    return origWriteFile.apply(fs.promises, args)
  }

  const origWriteFileSync = fs.writeFileSync
  fs.writeFileSync = function dotenvxPatchedWriteFileSync (...args) {
    const filePath = args[0].toString()
    debugLog('fs.writeFileSync:', filePath)

    if (!injectedTurbopackRuntime && filePath.endsWith('/.next/export-detail.json')) {
      const nextDirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      injectDotenvxInitIntoTurbopackRuntime(nextDirPath, env)
    }

    return origWriteFileSync.apply(fs, args)
  }
}

module.exports = {
  activateTurbopackInjection,
  injectDotenvxInitIntoTurbopackRuntime,
  isInjectedTurbopackRuntime
}
