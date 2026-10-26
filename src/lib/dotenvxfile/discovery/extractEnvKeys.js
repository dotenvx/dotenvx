// Best-effort static syntax extraction, independent of traversal and filesystem I/O.
// Deliberately does not evaluate expressions or follow runtime-computed key names.
const identifier = '[A-Za-z_][A-Za-z0-9_]*'
const literal = `(['"\x60])(${identifier})\\1`
const member = '\\s*(?:\\?\\.|\\.)\\s*'
const envMember = `(?:${member}env|\\s*(?:\\?\\.\\s*)?\\[\\s*(?:'env'|"env")\\s*\\])`
const jsEnv = `(?:process${envMember}|import${member}meta${envMember})`
const boundary = '(?<![\\w$.])'

function escapeRegex (value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Match braces without counting braces inside quoted defaults or comments.
function openingBraces (source) {
  const openings = new Map()
  const stack = []
  let quote
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = undefined
    } else if ('\'"`'.includes(char)) quote = char
    else if (source.startsWith('//', i)) {
      const end = source.indexOf('\n', i + 2)
      i = end === -1 ? source.length : end
    } else if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 1
    } else if (char === '{') stack.push(i)
    else if (char === '}') openings.set(i, stack.pop())
  }
  return openings
}

// Split destructuring properties without treating commas in defaults or nested
// patterns as new properties. This also lets us ignore rest and computed names.
function properties (body) {
  const parts = []
  let start = 0
  let depth = 0
  let quote
  for (let i = 0; i < body.length; i++) {
    const char = body[i]
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = undefined
    } else if ('\'"`'.includes(char)) quote = char
    else if ('([{'.includes(char)) depth++
    else if (')]}'.includes(char)) depth--
    else if (char === ',' && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  parts.push(body.slice(start))
  return parts
}

module.exports = function extractEnvKeys (content, language) {
  // Preserve line breaks for import detection. Full parsing of every language is
  // intentionally outside this helper; inline comments/strings can still match.
  const source = content.split('\n').map(line => {
    const text = line.trimStart()
    if (['python', 'ruby', 'php'].includes(language) && text.startsWith('#')) return ''
    if (!['python', 'ruby'].includes(language) && /^(\/\/|\/\*|\*(?:\s|\/|$))/.test(text)) return ''
    return line
  }).join('\n')
  const keys = new Set()
  function collect (pattern, group = 2, input = source) {
    for (const match of input.matchAll(new RegExp(pattern, 'g'))) keys.add(match[group])
  }
  function call (base) {
    collect(`${boundary}(?:${base})\\s*\\(\\s*${literal}\\s*(?=[,)])`)
  }
  function bracket (base) {
    collect(`${boundary}(?:${base})\\s*\\[\\s*${literal}\\s*\\]`)
  }

  if (language === 'js') {
    const bases = [{ base: jsEnv, start: 0 }]
    // Only immutable, direct bindings: no evaluation or guessed dynamic aliases.
    const binding = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g
    for (const match of source.matchAll(binding)) {
      const value = match[2].trim()
      if (!bases.some(({ base }) => new RegExp(`^(?:${base})$`).test(value))) continue
      bases.push({ base: escapeRegex(match[1]), start: match.index + match[0].length })
    }
    for (const { base, start } of bases) {
      const input = source.slice(start)
      collect(`${boundary}(?:${base})${member}(${identifier})\\b`, 1, input)
      collect(`${boundary}(?:${base})\\s*(?:\\?\\.\\s*)?\\[\\s*${literal}\\s*\\]`, 2, input)
      const openings = openingBraces(input)
      for (const match of input.matchAll(new RegExp(`}\\s*=\\s*(?:${base})(?![\\w$]|\\s*(?:\\?\\.|\\.|\\[))`, 'g'))) {
        const opening = openings.get(match.index)
        if (opening === undefined) continue
        for (const property of properties(input.slice(opening + 1, match.index))) {
          const key = property.trim().match(new RegExp(`^(?:(${identifier})|['"](${identifier})['"]|\\[\\s*['"](${identifier})['"]\\s*\\])\\s*(?=[:,=]|$)`))
          if (key) keys.add(key[1] || key[2] || key[3])
        }
      }
    }
  } else if (language === 'python') {
    const modules = new Set(['os'])
    const getters = new Set()
    const environs = new Set()
    for (const match of source.matchAll(/^\s*import\s+([^\n;]+)/gm)) {
      for (const item of match[1].split(',')) {
        const imported = item.trim().match(/^os(?:\s+as\s+([A-Za-z_]\w*))?\s*(?:#.*)?$/)
        if (imported) modules.add(imported[1] || 'os')
      }
    }
    for (const match of source.matchAll(/^\s*from\s+os\s+import\s+(?:\(([^)]*)\)|([^\n;]+))/gm)) {
      for (const item of (match[1] || match[2]).split(',')) {
        const imported = item.replace(/#[^\n]*/g, '').trim().match(/^(getenv|environ)(?:\s+as\s+([A-Za-z_]\w*))?$/)
        if (!imported) continue
        const aliases = imported[1] === 'getenv' ? getters : environs
        aliases.add(imported[2] || imported[1])
      }
    }
    for (const name of modules) {
      call(`${escapeRegex(name)}\\s*\\.\\s*getenv`)
      environs.add(`${name}.environ`)
    }
    for (const name of getters) call(escapeRegex(name))
    for (const name of environs) {
      const base = name.split('.').map(escapeRegex).join('\\s*\\.\\s*')
      bracket(base)
      call(`${base}\\s*\\.\\s*get`)
    }
  } else if (language === 'go') {
    call('os\\s*\\.\\s*(?:Getenv|LookupEnv)')
    for (const match of source.matchAll(/\bimport\s+(?:\(([^)]*)\)|([^\n;]+))/g)) {
      for (const imported of (match[1] || match[2]).matchAll(/(?:^|[;\n])\s*([A-Za-z_]\w*|\.)\s+["`]os["`]\s*(?=$|[;\n]|\/\/)/g)) {
        const alias = imported[1]
        if (alias === '_') continue
        call(alias === '.' ? '(?:Getenv|LookupEnv)' : `${escapeRegex(alias)}\\s*\\.\\s*(?:Getenv|LookupEnv)`)
      }
    }
  } else if (language === 'ruby') {
    bracket('ENV')
    call('ENV\\s*\\.\\s*fetch')
    collect(`${boundary}ENV\\s*\\.\\s*fetch\\s+${literal}\\s*(?=,|$|[;\\r\\n])`)
  } else if (language === 'php') {
    call('getenv')
    bracket('\\$_(?:ENV|SERVER)')
  } else if (language === 'rust') {
    call('(?:std\\s*::\\s*)?env\\s*::\\s*(?:var|var_os)')
    // Expand Rust use trees, including grouped and renamed imports.
    function imports (tree, prefix = '') {
      for (const item of properties(tree)) {
        const value = item.trim()
        const group = value.indexOf('{')
        if (group !== -1 && value.endsWith('}')) {
          imports(value.slice(group + 1, -1), prefix + value.slice(0, group))
          continue
        }
        const [original, alias] = (prefix + value).split(/\s+as\s+/)
        const path = original.replace(/\s/g, '').replace(/::self$/, '')
        if (alias === '_') continue
        if (path === 'std::env') call(`${escapeRegex(alias || 'env')}\\s*::\\s*(?:var|var_os)`)
        if (/^std::env::(?:var|var_os)$/.test(path)) call(escapeRegex(alias || path.split('::').pop()))
      }
    }
    for (const match of source.matchAll(/\buse\s+([^;]+);/g)) imports(match[1])
  } else if (language === 'java') {
    call('(?:java\\s*\\.\\s*lang\\s*\\.\\s*)?System\\s*\\.\\s*getenv')
  } else if (language === 'csharp') {
    call('(?:System\\s*\\.\\s*)?Environment\\s*\\.\\s*GetEnvironmentVariable')
  }
  return [...keys].sort()
}
