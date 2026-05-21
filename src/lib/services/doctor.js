const { fdir: Fdir } = require('fdir')
const path = require('path')
const picomatch = require('picomatch')
const fsx = require('./../helpers/fsx')

const patterns = [
  { lang: 'Python', file: /\.py$/, match: /load_dotenv\s*\([^)]*\)/, msg: 'found python-dotenv load call' },
  { lang: 'Python', file: /\.py$/, match: /dotenv_values\s*\([^)]*\)/, msg: 'found python-dotenv values call' },

  { lang: 'Node', file: /\.(js|cjs|mjs|ts)$/, match: /require\(['"]dotenv['"]\)\.config\s*\([^)]*\)/, msg: 'found dotenv config require call' },
  { lang: 'Node', file: /\.(js|cjs|mjs|ts)$/, match: /import\s+['"]dotenv\/config['"]/, msg: 'found dotenv/config import' },
  { lang: 'Node', file: /\.(js|cjs|mjs|ts)$/, match: /dotenv\.config\s*\([^)]*\)/, msg: 'found dotenv config call' },

  { lang: 'Ruby', file: /\.rb$/, match: /Dotenv\.(load|overload)\s*\([^)]*\)/, msg: 'found ruby dotenv load call' },
  { lang: 'Go', file: /\.go$/, match: /godotenv\.(Load|Overload)\s*\([^)]*\)/, msg: 'found godotenv load call' },
  { lang: 'PHP', file: /\.php$/, match: /Dotenv\\Dotenv::create\w*\s*\([^)]*\)/, msg: 'found vlucas/phpdotenv loader' },

  { lang: 'Rust', file: /\.rs$/, match: /dotenvy?::dotenv\s*\([^)]*\)/, msg: 'found Rust dotenv load call' },
  { lang: 'Java', file: /\.java$/, match: /Dotenv\.(load|configure)\s*\([^)]*\)/, msg: 'found java-dotenv load call' },
  { lang: 'Kotlin', file: /\.kt$/, match: /Dotenv\.(load|configure)\s*\([^)]*\)/, msg: 'found java-dotenv load call' },
  { lang: '.NET', file: /\.(cs|fs|vb)$/, match: /(?:DotNetEnv\.)?Env\.Load\s*\([^)]*\)/, msg: 'found DotNetEnv load call' }
]

class Doctor {
  constructor (directory = './') {
    this.cwd = path.resolve(directory)
    this.ignore = [
      '**/node_modules/**',
      '**/.git/**',
      '**/vendor/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**'
    ]
    this.exclude = picomatch(this.ignore)
  }

  run () {
    const findings = []

    for (const filepath of this._filepaths()) {
      findings.push(...this._scanFile(filepath))
    }

    return findings
  }

  _filepaths () {
    return new Fdir()
      .withRelativePaths()
      .exclude((dir, filepath) => this._ignored(filepath))
      .filter((filepath) => this._patternsFor(filepath).length > 0)
      .crawl(this.cwd)
      .sync()
      .sort()
  }

  _scanFile (relativeFilepath) {
    const src = fsx.readFileXSync(path.join(this.cwd, relativeFilepath))
    const lines = src.split(/\r?\n/)
    const findings = []

    lines.forEach((line, index) => {
      for (const pattern of this._patternsFor(relativeFilepath)) {
        if (pattern.match.test(line)) {
          const match = line.match(pattern.match)
          findings.push({
            lang: pattern.lang,
            filepath: relativeFilepath,
            line: index + 1,
            code: match[0].trim(),
            msg: pattern.msg
          })
        }
      }
    })

    return findings
  }

  _patternsFor (filepath) {
    return patterns.filter(pattern => pattern.file.test(filepath))
  }

  _ignored (filepath) {
    return this.exclude(filepath)
  }
}

Doctor.patterns = patterns

module.exports = Doctor
