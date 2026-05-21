const t = require('tap')

const Doctor = require('../../../src/lib/services/doctor')

t.test('#run', ct => {
  const doctor = new Doctor('./tests/fixtures/doctor')

  const findings = doctor.run()

  const expected = [
    { lang: 'Java', filepath: 'App.java', line: 5, code: 'Dotenv.load()', msg: 'found java-dotenv load call' },
    { lang: 'Java', filepath: 'App.java', line: 6, code: 'Dotenv.configure()', msg: 'found java-dotenv load call' },
    { lang: 'Kotlin', filepath: 'App.kt', line: 4, code: 'Dotenv.load()', msg: 'found java-dotenv load call' },
    { lang: '.NET', filepath: 'Program.cs', line: 3, code: 'DotNetEnv.Env.Load()', msg: 'found DotNetEnv load call' },
    { lang: '.NET', filepath: 'Program.cs', line: 4, code: 'Env.Load()', msg: 'found DotNetEnv load call' },
    { lang: '.NET', filepath: 'Program.fs', line: 3, code: 'DotNetEnv.Env.Load()', msg: 'found DotNetEnv load call' },
    { lang: '.NET', filepath: 'Program.vb', line: 3, code: 'Env.Load()', msg: 'found DotNetEnv load call' },
    { lang: 'Python', filepath: 'app.py', line: 3, code: 'load_dotenv(override=True)', msg: 'found python-dotenv load call' },
    { lang: 'Python', filepath: 'app.py', line: 4, code: 'dotenv_values(".env")', msg: 'found python-dotenv values call' },
    { lang: 'Ruby', filepath: 'app.rb', line: 1, code: 'Dotenv.load(".env")', msg: 'found ruby dotenv load call' },
    { lang: 'Node', filepath: 'config.mjs', line: 1, code: "import 'dotenv/config'", msg: 'found dotenv/config import' },
    { lang: 'Node', filepath: 'index.js', line: 1, code: "require('dotenv').config()", msg: 'found dotenv config require call' },
    { lang: 'Node', filepath: 'index.js', line: 4, code: 'dotenv.config({ override: true })', msg: 'found dotenv config call' },
    { lang: 'PHP', filepath: 'index.php', line: 3, code: 'Dotenv\\Dotenv::createImmutable(__DIR__)', msg: 'found vlucas/phpdotenv loader' },
    { lang: 'Go', filepath: 'main.go', line: 4, code: 'godotenv.Overload()', msg: 'found godotenv load call' },
    { lang: 'Rust', filepath: 'main.rs', line: 2, code: 'dotenvy::dotenv()', msg: 'found Rust dotenv load call' },
    { lang: 'Rust', filepath: 'main.rs', line: 3, code: 'dotenv::dotenv()', msg: 'found Rust dotenv load call' }
  ]

  ct.same(findings, expected)
  ct.end()
})

t.test('#run ignores dependency and build directories', ct => {
  const doctor = new Doctor('./tests/fixtures/doctor')

  const filepaths = doctor.run().map(finding => finding.filepath)

  ct.notOk(filepaths.includes('node_modules/ignored.js'))
  ct.notOk(filepaths.includes('dist/ignored.py'))
  ct.end()
})

t.test('#run returns empty when no loaders are found', ct => {
  const doctor = new Doctor('./tests/fixtures')

  const findings = doctor._scanFile('doctor/README.md')

  ct.same(findings, [])
  ct.end()
})
