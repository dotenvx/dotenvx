# YubiKey + GPG Support Implementation Plan for dotenvx

## Executive Summary

This plan extends dotenvx to support GPG-based encryption/decryption of environment variables, enabling YubiKey hardware security module integration. The implementation adds a `--gpg` flag to existing commands while maintaining full backward compatibility with ECIES encryption.

---

## Design Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger Method | `--gpg` flag on existing commands | Cleanest upgrade path, non-breaking |
| Config Persistence | `DOTENVX_CRYPTO=gpg` env var | No new file system, simple |
| Encryption Scope | Individual values | Consistent with ECIES approach |
| Key Reference | Both key ID/fingerprint and email | Maximum flexibility |
| GPG Backend | gpg CLI (spawn) | YubiKey works out of box |
| Encrypted Prefix | `gpg:encrypted:` | Clear distinction from ECIES |

---

## Architecture Overview

### Current ECIES Flow
```
encrypt: value → eciesjs.encrypt(publicKey, value) → "encrypted:BASE64"
decrypt: "encrypted:BASE64" → eciesjs.decrypt(privateKey, ciphertext) → value
```

### New GPG Flow
```
encrypt: value → gpg --encrypt --recipient KEY → "gpg:encrypted:BASE64"
decrypt: "gpg:encrypted:BASE64" → gpg --decrypt → value (YubiKey prompts for PIN)
```

### Unified Architecture
```
                     ┌─────────────────────────────────────────┐
                     │           CLI Layer                     │
                     │  encrypt/decrypt/set/run commands       │
                     │         + --gpg flag                    │
                     └─────────────────┬───────────────────────┘
                                       │
                     ┌─────────────────▼───────────────────────┐
                     │         Service Layer                   │
                     │  Encrypt/Decrypt/Sets services          │
                     │  (crypto provider selection)            │
                     └─────────────────┬───────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
    ┌─────────▼─────────┐    ┌────────▼────────┐    ┌─────────▼─────────┐
    │   ECIES Helpers   │    │   GPG Helpers   │    │  Crypto Strategy  │
    │ encryptValue.js   │    │ gpgEncrypt.js   │    │  getCryptoProvider│
    │ decryptKeyValue.js│    │ gpgDecrypt.js   │    │                   │
    └───────────────────┘    └─────────────────┘    └───────────────────┘
```

---

## Implementation Phases

### Phase 1: Core GPG Helpers (Foundation)

#### 1.1 Create `src/lib/helpers/gpgAvailable.js`
Check if gpg is installed and accessible.

```javascript
// Checks if gpg CLI is available
// Returns: { available: boolean, version: string|null, error: string|null }
const { execSync } = require('child_process')

function gpgAvailable () {
  try {
    const version = execSync('gpg --version', { encoding: 'utf8', timeout: 5000 })
    const match = version.match(/gpg \(GnuPG\) (\d+\.\d+\.\d+)/)
    return {
      available: true,
      version: match ? match[1] : 'unknown',
      error: null
    }
  } catch (e) {
    return {
      available: false,
      version: null,
      error: 'gpg not found. Install GnuPG: https://gnupg.org/download/'
    }
  }
}

module.exports = gpgAvailable
```

#### 1.2 Create `src/lib/helpers/gpgEncryptValue.js`
Encrypt a single value using GPG.

```javascript
// Encrypts value using GPG with specified recipient
// recipient: GPG key ID, fingerprint, or email
// Returns: "gpg:encrypted:BASE64"
const { execSync } = require('child_process')

const GPG_PREFIX = 'gpg:encrypted:'

function gpgEncryptValue (value, recipient) {
  // Validate recipient
  if (!recipient) {
    const error = new Error('GPG recipient (key ID or email) is required')
    error.code = 'MISSING_GPG_RECIPIENT'
    error.help = 'Set DOTENV_GPG_KEY or use --gpg-key flag'
    throw error
  }

  try {
    // --armor: ASCII output
    // --trust-model always: skip trust db check (useful for CI)
    // --batch: non-interactive
    // --yes: overwrite without prompt
    const ciphertext = execSync(
      `gpg --encrypt --armor --recipient "${recipient}" --trust-model always --batch --yes`,
      {
        input: value,
        encoding: 'utf8',
        timeout: 30000, // 30s timeout for YubiKey interaction
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )

    // Extract base64 from ASCII armor
    const base64 = extractBase64FromArmor(ciphertext)
    return `${GPG_PREFIX}${base64}`
  } catch (e) {
    const error = new Error(`GPG encryption failed: ${e.message}`)
    error.code = 'GPG_ENCRYPTION_FAILED'
    error.help = `Verify GPG key exists: gpg --list-keys ${recipient}`
    throw error
  }
}

function extractBase64FromArmor (armoredText) {
  // Remove header, footer, and blank lines
  const lines = armoredText.split('\n')
  const dataLines = lines.filter(line =>
    !line.startsWith('-----') &&
    !line.startsWith('Version:') &&
    !line.startsWith('Comment:') &&
    line.trim() !== ''
  )
  return dataLines.join('')
}

module.exports = gpgEncryptValue
module.exports.GPG_PREFIX = GPG_PREFIX
```

#### 1.3 Create `src/lib/helpers/gpgDecryptValue.js`
Decrypt a GPG-encrypted value (will prompt for YubiKey PIN if configured).

```javascript
// Decrypts GPG-encrypted value
// For YubiKey: will trigger PIN prompt via gpg-agent
// Returns: plaintext value
const { execSync, spawnSync } = require('child_process')

const GPG_PREFIX = 'gpg:encrypted:'

function gpgDecryptValue (key, value) {
  if (!value.startsWith(GPG_PREFIX)) {
    return value
  }

  const base64 = value.substring(GPG_PREFIX.length)
  const armoredCiphertext = wrapInArmor(base64)

  try {
    // gpg-agent handles PIN prompts for YubiKey
    // --batch allows non-interactive if key is unlocked
    // Without --batch, allows PIN prompts
    const result = spawnSync('gpg', ['--decrypt', '--quiet'], {
      input: armoredCiphertext,
      encoding: 'utf8',
      timeout: 60000, // 60s timeout for YubiKey PIN entry
      stdio: ['pipe', 'pipe', 'pipe']
    })

    if (result.status !== 0) {
      throw new Error(result.stderr || 'Decryption failed')
    }

    return result.stdout
  } catch (e) {
    const error = new Error(`GPG decryption failed for key '${key}': ${e.message}`)
    error.code = 'GPG_DECRYPTION_FAILED'
    error.help = [
      'Possible causes:',
      '  1. YubiKey not inserted',
      '  2. Wrong PIN entered',
      '  3. GPG key not available',
      'Debug: gpg --decrypt --verbose'
    ].join('\n')
    throw error
  }
}

function wrapInArmor (base64) {
  // Reconstruct PGP message armor
  const lines = base64.match(/.{1,64}/g) || [base64]
  return [
    '-----BEGIN PGP MESSAGE-----',
    '',
    ...lines,
    '-----END PGP MESSAGE-----'
  ].join('\n')
}

module.exports = gpgDecryptValue
module.exports.GPG_PREFIX = GPG_PREFIX
```

#### 1.4 Create `src/lib/helpers/isGpgEncrypted.js`
Check if a value is GPG-encrypted.

```javascript
const GPG_PREFIX = 'gpg:encrypted:'

function isGpgEncrypted (value) {
  if (typeof value !== 'string') {
    return false
  }
  return value.startsWith(GPG_PREFIX)
}

module.exports = isGpgEncrypted
```

#### 1.5 Create `src/lib/helpers/getCryptoProvider.js`
Determine which crypto provider to use based on options and environment.

```javascript
// Determines crypto provider: 'ecies' (default) or 'gpg'
// Priority: 1. --gpg flag, 2. DOTENVX_CRYPTO env, 3. default 'ecies'

function getCryptoProvider (options = {}) {
  // Explicit --gpg flag takes highest priority
  if (options.gpg === true) {
    return 'gpg'
  }

  // Check environment variable
  const envCrypto = process.env.DOTENVX_CRYPTO
  if (envCrypto === 'gpg') {
    return 'gpg'
  }

  // Default to ECIES
  return 'ecies'
}

module.exports = getCryptoProvider
```

#### 1.6 Create `src/lib/helpers/getGpgRecipient.js`
Get GPG recipient from options or environment.

```javascript
// Gets GPG recipient (key ID, fingerprint, or email)
// Priority: 1. --gpg-key flag, 2. DOTENV_GPG_KEY env

function getGpgRecipient (options = {}, envFilepath = null) {
  // Check --gpg-key flag
  if (options.gpgKey) {
    return options.gpgKey
  }

  // Check environment variables
  // Support environment-specific keys: DOTENV_GPG_KEY_PRODUCTION, etc.
  if (envFilepath) {
    const envSuffix = getEnvSuffix(envFilepath)
    if (envSuffix) {
      const envSpecificKey = process.env[`DOTENV_GPG_KEY_${envSuffix.toUpperCase()}`]
      if (envSpecificKey) {
        return envSpecificKey
      }
    }
  }

  // Fallback to generic key
  return process.env.DOTENV_GPG_KEY || null
}

function getEnvSuffix (envFilepath) {
  // Extract environment from filepath like .env.production → PRODUCTION
  const match = envFilepath.match(/\.env\.(.+)$/)
  return match ? match[1] : null
}

module.exports = getGpgRecipient
```

---

### Phase 2: Update Existing Helpers

#### 2.1 Update `src/lib/helpers/isEncrypted.js`
Add GPG encryption detection.

```javascript
// Current: checks for 'encrypted:' prefix (ECIES)
// Updated: also check for 'gpg:encrypted:' prefix

const ECIES_PREFIX = 'encrypted:'
const GPG_PREFIX = 'gpg:encrypted:'

function isEncrypted (value) {
  if (typeof value !== 'string') {
    return false
  }
  return value.startsWith(ECIES_PREFIX) || value.startsWith(GPG_PREFIX)
}

module.exports = isEncrypted
```

#### 2.2 Update `src/lib/helpers/decryptKeyValue.js`
Add GPG decryption support alongside ECIES.

```javascript
// Add at top
const gpgDecryptValue = require('./gpgDecryptValue')
const isGpgEncrypted = require('./isGpgEncrypted')

// In function body, add GPG branch:
function decryptKeyValue (key, value, privateKeyName, privateKey) {
  // Handle GPG-encrypted values
  if (isGpgEncrypted(value)) {
    return gpgDecryptValue(key, value)
  }

  // Existing ECIES logic...
}
```

---

### Phase 3: Update Services

#### 3.1 Update `src/lib/services/encrypt.js`
Add GPG encryption mode.

**Constructor changes:**
```javascript
constructor (envs = [], key = [], excludeKey = [], envKeysFilepath = null, options = {}) {
  // ... existing ...
  this.cryptoProvider = getCryptoProvider(options)
  this.gpgRecipient = getGpgRecipient(options)
}
```

**_encryptEnvFile changes:**
```javascript
// In the encryption loop, branch based on crypto provider:
if (this.cryptoProvider === 'gpg') {
  if (!this.gpgRecipient) {
    throw new Error('GPG recipient required. Use --gpg-key or set DOTENV_GPG_KEY')
  }
  const encryptedValue = gpgEncryptValue(value, this.gpgRecipient)
  // ... rest same ...
} else {
  // Existing ECIES logic
  const encryptedValue = encryptValue(value, publicKey)
  // ...
}
```

**Key differences for GPG mode:**
- No keypair generation (uses existing GPG keys)
- No .env.keys file needed (GPG keyring is separate)
- Store `DOTENV_GPG_KEY` in .env file header instead of public key

#### 3.2 Update `src/lib/services/decrypt.js`
Add GPG decryption mode (mostly handled by updated decryptKeyValue helper).

**Changes:**
- The `decryptKeyValue` helper now handles GPG automatically
- For GPG values, privateKey parameter is ignored (gpg-agent handles it)
- Add logging for YubiKey operations

#### 3.3 Update `src/lib/services/sets.js`
Add GPG support to the set command.

**Constructor changes:**
```javascript
constructor (key, value, envs = [], encrypt = true, envKeysFilepath = null, options = {}) {
  // ... existing ...
  this.cryptoProvider = getCryptoProvider(options)
  this.gpgRecipient = getGpgRecipient(options)
}
```

**_setEnvFile changes:**
- Branch encryption logic based on `this.cryptoProvider`
- For GPG: use `gpgEncryptValue` instead of ECIES
- Skip keypair generation for GPG mode

---

### Phase 4: Update CLI Commands

#### 4.1 Update `src/cli/dotenvx.js` - Add Global GPG Options

```javascript
// Add to encrypt command
program.command('encrypt')
  // ... existing options ...
  .option('--gpg', 'use GPG encryption instead of ECIES')
  .option('--gpg-key <recipient>', 'GPG key ID, fingerprint, or email for encryption')
  .action(function (...args) {
    this.envs = envs
    this.gpgOptions = { gpg: this.opts().gpg, gpgKey: this.opts().gpgKey }
    encryptAction.apply(this, args)
  })

// Add to decrypt command
program.command('decrypt')
  // ... existing options ...
  .option('--gpg', 'expect GPG-encrypted values (auto-detected if not specified)')
  .action(function (...args) {
    this.envs = envs
    this.gpgOptions = { gpg: this.opts().gpg }
    decryptAction.apply(this, args)
  })

// Add to set command
program.command('set')
  // ... existing options ...
  .option('--gpg', 'use GPG encryption instead of ECIES')
  .option('--gpg-key <recipient>', 'GPG key ID, fingerprint, or email for encryption')
  .action(function (...args) {
    this.envs = envs
    this.gpgOptions = { gpg: this.opts().gpg, gpgKey: this.opts().gpgKey }
    setAction.apply(this, args)
  })

// Add to run command
program.command('run')
  // ... existing options ...
  .option('--gpg', 'expect GPG-encrypted values (for YubiKey decryption)')
```

#### 4.2 Update `src/cli/actions/encrypt.js`

```javascript
function encrypt () {
  const options = this.opts()
  const gpgOptions = this.gpgOptions || {}

  // Check GPG availability if --gpg flag used
  if (gpgOptions.gpg) {
    const gpg = gpgAvailable()
    if (!gpg.available) {
      logger.error(gpg.error)
      process.exit(1)
    }
    logger.verbose(`Using GPG ${gpg.version}`)
  }

  // Pass gpgOptions to service
  const service = new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, gpgOptions)
  // ... rest of logic ...
}
```

#### 4.3 Update `src/cli/actions/decrypt.js`

```javascript
function decrypt () {
  const options = this.opts()
  const gpgOptions = this.gpgOptions || {}

  // For GPG decryption, warn about YubiKey
  if (gpgOptions.gpg) {
    logger.verbose('GPG mode: YubiKey PIN may be required')
  }

  // ... rest of logic (decryptKeyValue handles GPG automatically) ...
}
```

#### 4.4 Update `src/cli/actions/set.js`

```javascript
function set (key, value) {
  const options = this.opts()
  const gpgOptions = this.gpgOptions || {}

  // Check GPG availability if using GPG encryption
  if (gpgOptions.gpg && !options.plain) {
    const gpg = gpgAvailable()
    if (!gpg.available) {
      logger.error(gpg.error)
      process.exit(1)
    }
  }

  // Pass gpgOptions to service
  const service = new Sets(key, value, envs, encrypt, options.envKeysFile, gpgOptions)
  // ... rest of logic ...
}
```

#### 4.5 Update CLI Examples (`src/cli/examples.js`)

Add GPG examples:

```javascript
const gpgExamples = `
Examples:
  $ dotenvx encrypt --gpg --gpg-key user@example.com
  $ dotenvx encrypt --gpg --gpg-key 0x1234ABCD
  $ dotenvx set SECRET value --gpg --gpg-key user@example.com
  $ DOTENV_GPG_KEY=user@example.com dotenvx encrypt --gpg
  $ DOTENVX_CRYPTO=gpg dotenvx encrypt
`
```

---

### Phase 5: Update TypeScript Definitions

#### 5.1 Update `src/lib/main.d.ts`

```typescript
// Add to DotenvConfigOptions
export interface DotenvConfigOptions {
  // ... existing ...

  /** Use GPG encryption instead of ECIES */
  gpg?: boolean

  /** GPG key ID, fingerprint, or email for encryption */
  gpgKey?: string
}

// Add new exports
export function gpgAvailable(): { available: boolean; version: string | null; error: string | null }
```

---

### Phase 6: Error Handling

#### 6.1 Update `src/lib/helpers/errors.js`

Add GPG-specific error codes:

```javascript
// Add new error methods
missingGpgKey () {
  const error = new Error(`[MISSING_GPG_KEY] GPG key not specified`)
  error.code = 'MISSING_GPG_KEY'
  error.help = `[MISSING_GPG_KEY] Set DOTENV_GPG_KEY environment variable or use --gpg-key flag`
  return error
}

gpgNotAvailable () {
  const error = new Error(`[GPG_NOT_AVAILABLE] gpg command not found`)
  error.code = 'GPG_NOT_AVAILABLE'
  error.help = `[GPG_NOT_AVAILABLE] Install GnuPG: https://gnupg.org/download/`
  return error
}

gpgEncryptionFailed (details) {
  const error = new Error(`[GPG_ENCRYPTION_FAILED] ${details}`)
  error.code = 'GPG_ENCRYPTION_FAILED'
  error.help = `[GPG_ENCRYPTION_FAILED] Check GPG key availability: gpg --list-keys`
  return error
}

gpgDecryptionFailed (key, details) {
  const error = new Error(`[GPG_DECRYPTION_FAILED] Unable to decrypt '${key}': ${details}`)
  error.code = 'GPG_DECRYPTION_FAILED'
  error.help = `[GPG_DECRYPTION_FAILED] Ensure YubiKey is inserted and correct PIN is used`
  return error
}

yubiKeyNotPresent () {
  const error = new Error(`[YUBIKEY_NOT_PRESENT] YubiKey required for decryption`)
  error.code = 'YUBIKEY_NOT_PRESENT'
  error.help = `[YUBIKEY_NOT_PRESENT] Insert your YubiKey and try again`
  return error
}
```

---

### Phase 7: Testing

#### 7.1 Unit Tests for New Helpers

Create test files:
- `tests/lib/helpers/gpgAvailable.test.js`
- `tests/lib/helpers/gpgEncryptValue.test.js`
- `tests/lib/helpers/gpgDecryptValue.test.js`
- `tests/lib/helpers/isGpgEncrypted.test.js`
- `tests/lib/helpers/getCryptoProvider.test.js`
- `tests/lib/helpers/getGpgRecipient.test.js`

**Test Strategy:**
- Mock gpg CLI calls using proxyquire/sinon
- Test error cases (gpg not installed, invalid key, etc.)
- Test armor encoding/decoding
- Test prefix detection

#### 7.2 Integration Tests for Services

Update existing test files:
- `tests/lib/services/encrypt.test.js` - add GPG mode tests
- `tests/lib/services/decrypt.test.js` - add GPG mode tests
- `tests/lib/services/sets.test.js` - add GPG mode tests

**Test Strategy:**
- Mock gpg CLI to avoid requiring actual GPG installation in CI
- Test crypto provider selection
- Test that ECIES still works unchanged

#### 7.3 CLI Tests

Update:
- `tests/cli/actions/encrypt.test.js`
- `tests/cli/actions/decrypt.test.js`
- `tests/cli/actions/set.test.js`

**Test Strategy:**
- Test --gpg flag parsing
- Test --gpg-key flag parsing
- Test DOTENVX_CRYPTO env var

#### 7.4 Shell Integration Tests

Add to `spec/`:
- `spec/gpg_encrypt_spec.sh` - if gpg available
- `spec/gpg_decrypt_spec.sh`

**Note:** These tests should be skipped in CI unless GPG test keys are set up.

---

### Phase 8: Documentation

#### 8.1 Update README.md

Add GPG section:

```markdown
## GPG / YubiKey Encryption

dotenvx supports GPG encryption for hardware security module integration.

### Prerequisites
- GnuPG installed (`gpg --version`)
- GPG key pair generated
- (Optional) YubiKey configured with GPG

### Usage

```bash
# Encrypt with GPG
dotenvx encrypt --gpg --gpg-key user@example.com

# Set with GPG encryption
dotenvx set API_KEY secret123 --gpg --gpg-key 0x1234ABCD

# Run with GPG-encrypted env (YubiKey PIN will be prompted)
dotenvx run --gpg -- node app.js

# Set default crypto provider
export DOTENVX_CRYPTO=gpg
export DOTENV_GPG_KEY=user@example.com
dotenvx encrypt  # now uses GPG by default
```

### YubiKey Integration

When using a YubiKey, the GPG agent will prompt for your PIN:
- First use: Enter PIN
- Subsequent uses: Cached for session (configurable)

Configure PIN caching in `~/.gnupg/gpg-agent.conf`:
```
default-cache-ttl 600
max-cache-ttl 7200
```
```

#### 8.2 Add GPG-specific examples to CLI help

Update `src/cli/examples.js` with GPG examples for each relevant command.

---

## File Change Summary

### New Files (8)
| File | Purpose |
|------|---------|
| `src/lib/helpers/gpgAvailable.js` | Check gpg CLI availability |
| `src/lib/helpers/gpgEncryptValue.js` | GPG encryption |
| `src/lib/helpers/gpgDecryptValue.js` | GPG decryption |
| `src/lib/helpers/isGpgEncrypted.js` | Check GPG prefix |
| `src/lib/helpers/getCryptoProvider.js` | Select crypto provider |
| `src/lib/helpers/getGpgRecipient.js` | Get GPG recipient |
| `tests/lib/helpers/gpg*.test.js` | Unit tests (6 files) |
| `spec/gpg_*.sh` | Shell integration tests |

### Modified Files (12)
| File | Changes |
|------|---------|
| `src/lib/helpers/isEncrypted.js` | Add GPG prefix check |
| `src/lib/helpers/decryptKeyValue.js` | Add GPG branch |
| `src/lib/helpers/errors.js` | Add GPG error codes |
| `src/lib/services/encrypt.js` | Add GPG mode |
| `src/lib/services/decrypt.js` | Support GPG values |
| `src/lib/services/sets.js` | Add GPG mode |
| `src/cli/dotenvx.js` | Add --gpg, --gpg-key flags |
| `src/cli/actions/encrypt.js` | Pass gpgOptions |
| `src/cli/actions/decrypt.js` | Pass gpgOptions |
| `src/cli/actions/set.js` | Pass gpgOptions |
| `src/cli/examples.js` | Add GPG examples |
| `src/lib/main.d.ts` | Add GPG types |

---

## Potential Challenges & Mitigations

### Challenge 1: GPG Agent / Pinentry
**Problem:** GPG decryption requires gpg-agent for PIN prompts, which may not work in all terminal environments.

**Mitigation:**
- Document gpg-agent configuration
- Suggest `GPG_TTY=$(tty)` for terminal issues
- Support `--batch` mode for pre-unlocked keys
- Add verbose logging for debugging

### Challenge 2: YubiKey Not Present
**Problem:** Runtime failures if YubiKey is removed mid-session.

**Mitigation:**
- Clear error messages directing user to insert YubiKey
- Graceful timeout handling (60s default)
- Option to skip GPG values with `--ignore=GPG_DECRYPTION_FAILED`

### Challenge 3: Mixed Encryption (ECIES + GPG in same file)
**Problem:** A .env file could have both ECIES and GPG encrypted values.

**Mitigation:**
- Both prefixes are distinct (`encrypted:` vs `gpg:encrypted:`)
- `decryptKeyValue` detects prefix and routes accordingly
- Document that mixing is supported

### Challenge 4: CI/CD Environments
**Problem:** GPG/YubiKey doesn't work in CI without setup.

**Mitigation:**
- Document that ECIES is recommended for CI
- Support pre-exported private keys via env vars
- Consider supporting `--gpg-passphrase` for non-interactive CI (with strong warnings)

### Challenge 5: Cross-Platform GPG Paths
**Problem:** GPG installation varies by OS (gpg vs gpg2, different paths).

**Mitigation:**
- Use `which gpg` to find binary
- Fall back to `gpg2` if `gpg` not found
- Support `DOTENVX_GPG_BIN` override env var

### Challenge 6: Large Values
**Problem:** GPG has size limits and is slower than ECIES for large payloads.

**Mitigation:**
- Document that GPG is best for small secrets
- Add warning for values > 100KB
- ECIES remains default for performance-critical use

---

## Implementation Order

Recommended order for incremental development:

1. **Phase 1** (Core Helpers) - Can be unit tested independently
2. **Phase 6** (Error Handling) - Foundation for good error messages
3. **Phase 2** (Update isEncrypted, decryptKeyValue) - Enable reading GPG values
4. **Phase 4.1-4.3** (CLI flags) - Wire up the interface
5. **Phase 3** (Services) - Connect helpers to services
6. **Phase 7** (Testing) - Validate implementation
7. **Phase 5** (TypeScript) - Add type definitions
8. **Phase 8** (Documentation) - Document features

---

## Usage Examples (Post-Implementation)

### Basic GPG Encryption
```bash
# Generate GPG key (one-time)
gpg --gen-key

# Encrypt .env file with GPG
dotenvx encrypt --gpg --gpg-key your@email.com

# Result: values now have gpg:encrypted: prefix
# DOTENV_GPG_KEY added to .env header
```

### YubiKey Workflow
```bash
# Developer with YubiKey
export DOTENV_GPG_KEY=your@email.com

# Encrypt secrets
dotenvx set DATABASE_URL "postgres://..." --gpg

# Run application (YubiKey PIN prompted once per session)
dotenvx run -- node app.js
```

### Persistent GPG Default
```bash
# Set default in shell profile
export DOTENVX_CRYPTO=gpg
export DOTENV_GPG_KEY=your@email.com

# Now all dotenvx commands use GPG by default
dotenvx encrypt        # uses GPG
dotenvx set KEY value  # encrypts with GPG
```

### Mixed Team (Some with YubiKey, Some Without)
```bash
# Team member with YubiKey encrypts
dotenvx encrypt --gpg --gpg-key team-secrets@company.com

# Team member without YubiKey can still read if they have the GPG private key
# (exported from YubiKey and imported to their gpg keyring)
dotenvx run -- node app.js
```

---

## Success Criteria

- [ ] `dotenvx encrypt --gpg --gpg-key KEY` encrypts values with `gpg:encrypted:` prefix
- [ ] `dotenvx decrypt` auto-detects and decrypts GPG values
- [ ] YubiKey prompts for PIN during decryption
- [ ] ECIES continues to work unchanged (backward compatible)
- [ ] Mixed ECIES + GPG values in same file work
- [ ] Clear error messages for missing GPG, missing key, YubiKey issues
- [ ] All existing tests pass
- [ ] New GPG tests pass (with mocked gpg)
- [ ] TypeScript definitions updated
- [ ] README documents GPG usage
