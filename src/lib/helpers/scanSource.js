const fs = require('node:fs/promises')
const path = require('node:path')
const { ignore } = require('@dotenvx/tooling')

const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor', '.venv', 'coverage', '__pycache__'])
const projectMarkers = new Set(['package.json', 'Envfile', '.env.schema'])
const languages = {
  js: 'js',
  mjs: 'js',
  cjs: 'js',
  jsx: 'js',
  ts: 'js',
  mts: 'js',
  cts: 'js',
  tsx: 'js',
  vue: 'js',
  svelte: 'js',
  astro: 'js',
  py: 'python',
  go: 'go',
  rb: 'ruby',
  php: 'php',
  rs: 'rust',
  java: 'java',
  cs: 'csharp'
}
const patterns = {
  js: [
    /\b(?:process\.env|import\.meta\.env)\.([A-Za-z_][A-Za-z0-9_]*)\b/g,
    /\b(?:process\.env|import\.meta\.env)\[\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1\s*\]/g
  ],
  python: [
    /\bos\.environ\[\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1\s*\]/g,
    /\bos\.(?:getenv|environ\.get)\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g
  ],
  go: [/\bos\.(?:Getenv|LookupEnv)\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g],
  ruby: [/\bENV(?:\[|\.fetch\()\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g],
  php: [/(?:\bgetenv\(|\$_(?:ENV|SERVER)\[)\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g],
  rust: [/\b(?:std::)?env::(?:var|var_os)\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g],
  java: [/\bSystem\.getenv\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g],
  csharp: [/\bEnvironment\.GetEnvironmentVariable\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g]
}

// Static references only: never execute source code or resolve dynamic property names.
function referencedKeys (content, language) {
  const source = content.split('\n').filter(line => {
    const text = line.trimStart()
    if (['python', 'ruby', 'php'].includes(language) && text.startsWith('#')) return false
    if (!['python', 'ruby'].includes(language) && /^(\/\/|\/\*|\*(?:\s|\/|$))/.test(text)) return false
    return true
  }).join('\n')
  const keys = []
  for (const pattern of patterns[language]) {
    for (const match of source.matchAll(pattern)) keys.push(match[2] || match[1])
  }
  if (language === 'js') {
    for (const match of source.matchAll(/\{([^{}]*)\}\s*=\s*(?:process\.env|import\.meta\.env)\b/g)) {
      for (const property of match[1].split(',')) {
        const key = property.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s*[:,=]|\s*$)/)
        if (key) keys.push(key[1])
      }
    }
  }
  return keys
}

module.exports = async function scanSource ({ directory = process.cwd(), onFile = () => {} } = {}) {
  const root = path.resolve(directory)
  const keys = new Set()
  let scannedFiles = 0
  const files = []

  async function walk (directory, parents) {
    const entries = (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
    if (directory !== root && entries.some(entry => entry.isFile() && projectMarkers.has(entry.name))) return
    const rules = [...parents]
    if (entries.some(entry => entry.name === '.gitignore' && entry.isFile())) {
      rules.push({ directory, matcher: ignore().add(await fs.readFile(path.join(directory, '.gitignore'), 'utf8')) })
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.env') || entry.isSymbolicLink()) continue
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
      const filename = path.join(directory, entry.name)
      let ignored = false
      for (const rule of rules) {
        const relative = path.relative(rule.directory, filename).split(path.sep).join('/') + (entry.isDirectory() ? '/' : '')
        const result = rule.matcher.test(relative)
        if (result.ignored) ignored = true
        else if (result.unignored) ignored = false
      }
      if (ignored) continue
      if (entry.isDirectory()) {
        await walk(filename, rules)
      } else if (entry.isFile()) {
        const language = languages[path.extname(entry.name).slice(1).toLowerCase()]
        if (language) files.push({ filename, language })
      }
    }
  }

  await walk(root, [])
  let nextFile = 0
  async function worker () {
    while (nextFile < files.length) {
      const { filename, language } = files[nextFile++]
      if ((await fs.stat(filename)).size > 1024 * 1024) continue
      const content = await fs.readFile(filename, 'utf8')
      if (content.includes('\0')) continue
      onFile(path.relative(root, filename))
      scannedFiles++
      for (const key of referencedKeys(content, language)) {
        if (!/^DOTENV_(?:PUBLIC|PRIVATE)_KEY(?:_|$)/.test(key)) keys.add(key)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(50, files.length) }, worker))
  return { keys: [...keys].sort(), scannedFiles }
}
