# YubiKey + GPG Support Implementation Progress

## Status: COMPLETE

All tasks have been implemented, all 2435 tests pass, and StandardJS linting passes.

---

## Implementation Summary

### Design Decisions Made

Based on user input, the following design choices were made:

| Decision | Choice |
|----------|--------|
| Trigger method | `--gpg` flag on existing commands |
| Encryption scope | Individual values (like ECIES approach) |
| Key reference | Both key ID/fingerprint and email supported |
| GPG backend | GPG CLI (spawn) for YubiKey compatibility |
| Config storage | `DOTENVX_CRYPTO=gpg` environment variable |
| Encrypted prefix | `gpg:encrypted:` |

---

## Files Created

### New Helper Files (6 files)

1. **`src/lib/helpers/gpgAvailable.js`**
   - Checks if GPG CLI (`gpg` or `gpg2`) is available
   - Returns version info and binary path
   - Used to validate GPG installation before encryption

2. **`src/lib/helpers/gpgEncryptValue.js`**
   - Encrypts values using GPG CLI
   - Uses ASCII armor format, extracts base64 content
   - Returns `gpg:encrypted:<base64>` format
   - Spawns: `gpg --encrypt --armor --recipient X --trust-model always --batch --yes`

3. **`src/lib/helpers/gpgDecryptValue.js`**
   - Decrypts GPG-encrypted values
   - Reconstructs ASCII armor from base64 for GPG CLI
   - 60-second timeout for YubiKey PIN entry
   - Handles `YUBIKEY_NOT_PRESENT` and `GPG_BAD_PIN` errors

4. **`src/lib/helpers/isGpgEncrypted.js`**
   - Simple check for `gpg:encrypted:` prefix
   - Used to route decryption to correct handler

5. **`src/lib/helpers/getCryptoProvider.js`**
   - Determines crypto provider from options/environment
   - Priority: `options.gpg=true` > `DOTENVX_CRYPTO=gpg` > default `ecies`

6. **`src/lib/helpers/getGpgRecipient.js`**
   - Gets GPG recipient (key ID/email) from multiple sources
   - Priority: `options.gpgKey` > `DOTENV_GPG_KEY_<ENV>` > `DOTENV_GPG_KEY`

### New Test Files (4 files)

1. **`tests/lib/helpers/gpgAvailable.test.js`**
   - Tests GPG detection with mocked child_process
   - Tests fallback from `gpg` to `gpg2`
   - Tests version parsing

2. **`tests/lib/helpers/getCryptoProvider.test.js`**
   - Tests default ECIES behavior
   - Tests `--gpg` flag override
   - Tests `DOTENVX_CRYPTO` environment variable

3. **`tests/lib/helpers/getGpgRecipient.test.js`**
   - Tests option precedence
   - Tests environment-specific keys (e.g., `DOTENV_GPG_KEY_PRODUCTION`)
   - Tests fallback behavior

4. **`tests/lib/helpers/isGpgEncrypted.test.js`**
   - Tests `gpg:encrypted:` prefix detection
   - Tests non-GPG values return false

---

## Files Modified

### CLI Layer

1. **`src/cli/dotenvx.js`**
   - Added `--gpg` flag to `encrypt`, `decrypt`, and `set` commands
   - Added `--gpg-key <recipient>` option for specifying GPG key

2. **`src/cli/actions/encrypt.js`**
   - Added GPG availability check when `--gpg` flag is used
   - Added GPG-specific success messages
   - Shows GPG recipient and YubiKey PIN prompt info

3. **`src/cli/actions/set.js`**
   - Added GPG availability check when `--gpg` flag is used
   - Added GPG-specific success messages
   - Passes gpgOptions to Sets service

### Service Layer

4. **`src/lib/services/encrypt.js`**
   - Added full GPG encryption mode with branching logic
   - Constructor now accepts `options` parameter for GPG settings
   - Added `_prependGpgKey()` for DOTENV_GPG_KEY header generation
   - Added `_guessGpgKeyName()` for environment-specific GPG key names
   - Added `_isGpgKeyVar()` to skip encrypting GPG key variables
   - GPG mode stores `DOTENV_GPG_KEY` in .env header (no .env.keys file needed)

5. **`src/lib/services/sets.js`**
   - Added GPG encryption support mirroring encrypt.js
   - Added same helper methods for GPG key handling
   - Handles GPG-encrypted value comparison for change detection

### Helper Layer

6. **`src/lib/helpers/isEncrypted.js`**
   - Now detects both ECIES (`encrypted:`) and GPG (`gpg:encrypted:`) prefixes
   - Added type checking for non-string values

7. **`src/lib/helpers/decryptKeyValue.js`**
   - Added GPG detection at start of function
   - Routes GPG-encrypted values to `gpgDecryptValue`
   - Falls through to existing ECIES logic for non-GPG values

8. **`src/lib/helpers/errors.js`**
   - Added `missingGpgRecipient()` - when --gpg-key not provided
   - Added `gpgNotAvailable()` - when GPG CLI not found
   - Added `gpgEncryptionFailed()` - encryption errors
   - Added `gpgDecryptionFailed()` - decryption errors
   - Added `yubiKeyNotPresent()` - YubiKey not inserted
   - Added `gpgBadPin()` - incorrect PIN entered

### Type Definitions

9. **`src/lib/main.d.ts`**
   - Added `gpg` and `gpgKey` to `SetOptions` interface
   - Added `cryptoProvider` and `gpgRecipient` to `SetProcessedEnv` interface
   - Added `GpgAvailableOutput` interface
   - Added `gpgAvailable()` function export

### Exports

10. **`src/lib/main.js`**
    - Exported `gpgAvailable` function for programmatic access
    - Updated `set()` function to pass gpgOptions to Sets service

### Tests

11. **`tests/lib/helpers/isEncrypted.test.js`**
    - Added tests for GPG encrypted values
    - Added tests for undefined/number inputs

---

## Git Diff Summary

```
 src/cli/actions/encrypt.js            |  33 +++-
 src/cli/actions/set.js                |  31 +++-
 src/cli/dotenvx.js                    |   5 +
 src/lib/helpers/decryptKeyValue.js    |   7 +
 src/lib/helpers/errors.js             |  67 ++++++++
 src/lib/helpers/isEncrypted.js        |  13 +-
 src/lib/main.d.ts                     |  36 +++++
 src/lib/main.js                       |  11 +-
 src/lib/services/encrypt.js           | 280 ++++++++++++++++++++++------------
 src/lib/services/sets.js              | 206 ++++++++++++++++---------
 tests/lib/helpers/isEncrypted.test.js |  24 +++
 11 files changed, 540 insertions(+), 173 deletions(-)
```

Plus 10 new files (6 helpers + 4 tests).

---

## Usage Examples

### Encrypt with GPG

```bash
# Encrypt all values in .env with GPG
dotenvx encrypt --gpg --gpg-key user@example.com

# Encrypt specific file
dotenvx encrypt -f .env.production --gpg --gpg-key user@example.com

# Encrypt specific keys only
dotenvx encrypt -k "API_KEY" -k "SECRET" --gpg --gpg-key user@example.com
```

### Set Value with GPG Encryption

```bash
# Set and encrypt a value with GPG
dotenvx set SECRET_KEY "myvalue" --gpg --gpg-key user@example.com

# Set in specific file
dotenvx set -f .env.production DB_PASSWORD "secret" --gpg --gpg-key user@example.com
```

### Decrypt (Auto-detects GPG)

```bash
# Decrypt automatically detects gpg:encrypted: prefix
dotenvx decrypt

# Decrypt specific file
dotenvx decrypt -f .env.production
```

### Run with GPG-encrypted .env

```bash
# Run command - YubiKey PIN will be prompted if needed
dotenvx run -- node app.js

# Run with specific env file
dotenvx run -f .env.production -- npm start
```

### Environment Variables

```bash
# Set default crypto provider
export DOTENVX_CRYPTO=gpg

# Set default GPG recipient
export DOTENV_GPG_KEY=user@example.com

# Environment-specific recipients
export DOTENV_GPG_KEY_PRODUCTION=prod-team@example.com
export DOTENV_GPG_KEY_STAGING=staging-team@example.com
```

### Programmatic API

```javascript
const dotenvx = require('@dotenvx/dotenvx')

// Check GPG availability
const gpg = dotenvx.gpgAvailable()
console.log(gpg) // { available: true, version: '2.4.0', bin: 'gpg', error: null }

// Set with GPG encryption
dotenvx.set('API_KEY', 'secret', {
  gpg: true,
  gpgKey: 'user@example.com'
})
```

---

## Encrypted File Format

### GPG-encrypted .env file

```bash
#/-------------------[DOTENV_GPG_KEY]------------------------/
#/            GPG/YubiKey encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)      /
#/----------------------------------------------------------/
DOTENV_GPG_KEY="user@example.com"

# .env
SECRET_KEY="gpg:encrypted:hQIMA8T7l1mAU4JvARAA..."
API_TOKEN="gpg:encrypted:hQIMA8T7l1mAU4JvARAB..."
```

---

## Test Results

```
# { total: 2435, pass: 2435 }
# time=15975.845ms
```

All tests pass including:
- Existing ECIES encryption tests (unchanged behavior)
- New GPG helper tests
- CLI action tests
- Service layer tests
- E2E tests

---

## Known Limitations

1. **GPG must be installed** - The implementation requires GPG CLI (`gpg` or `gpg2`) to be available in PATH

2. **YubiKey PIN prompts** - When using hardware keys, PIN prompts are handled by GPG agent. The 60-second timeout allows time for PIN entry.

3. **No key management** - This implementation doesn't manage GPG keys; users must have their GPG keyring configured

4. **Recipient trust** - Uses `--trust-model always` to avoid interactive trust prompts during encryption

---

## Future Enhancements (Not Implemented)

- `dotenvx gpg:status` - Show GPG configuration status
- `dotenvx gpg:test` - Test encryption/decryption with current key
- GUI PIN entry integration for non-TTY environments
- Support for multiple recipients (encrypt for team)
