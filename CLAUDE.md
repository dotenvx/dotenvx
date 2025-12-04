# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

dotenvx is a secure, cross-platform dotenv solution with encryption support. It provides both a CLI tool and a programmatic library for managing environment variables with features like multi-environment support and ECIES encryption (secp256k1).

## Commands

```bash
# Linting (StandardJS - no config needed)
npm run standard              # Check linting
npm run standard:fix          # Auto-fix issues

# Testing
npm test                      # Run TAP unit tests
npm run test-coverage         # Run tests with coverage
npm run testshell             # Run shell/integration tests (bash/shellspec)
npm run prerelease            # Run all tests (npm test && npm run testshell)

# Local development
./src/cli/dotenvx.js run -- echo $HELLO     # Test CLI directly
node -e "require('./src/lib/main.js').config()"  # Test library
```

## Architecture

```
/src
├── /cli                 # CLI interface (commander.js)
│   ├── dotenvx.js      # Main CLI entry point (bin)
│   ├── /actions        # CLI action implementations (run, get, set, encrypt, decrypt, etc.)
│   └── /commands       # Complex commands (ext.js routes extension commands)
├── /lib                # Library/programmatic interface
│   ├── main.js         # Main export: config(), parse(), get(), set(), ls()
│   ├── main.d.ts       # TypeScript definitions
│   ├── /services       # Business logic classes (each has .run() method)
│   └── /helpers        # 59+ utility functions (parse, encrypt, decrypt, buildEnvs, etc.)
└── /shared             # Logger and colors utilities

/tests                  # Mirror of src structure
├── /lib, /cli          # TAP unit tests
├── /monorepo           # Integration test fixtures
└── /spec               # Shell-based tests (shellspec)
```

### Control Flow

```
CLI Commands → CLI Actions → Services → Helpers
                                ↓
                          Shared Utilities
```

### Key Entry Points

- **CLI**: `/src/cli/dotenvx.js` - commander.js based CLI
- **Library**: `/src/lib/main.js` - exports `config()`, `parse()`, `get()`, `set()`, `ls()`
- **Auto-config**: `require('@dotenvx/dotenvx/config')` - calls config() on import

## Key Patterns

### Encryption
- ECIES with secp256k1 (Bitcoin-grade crypto)
- Encrypted values prefixed with `"encrypted:"`
- Public key: `DOTENV_PUBLIC_KEY` in `.env` file
- Private key: `DOTENV_PRIVATE_KEY` in `.env.keys` (gitignored)

### Error Handling
- Centralized in `/lib/helpers/errors.js`
- Named error codes: `MISSING_ENV_FILE`, `MISSING_KEY`, etc.
- `strict` mode throws immediately; tolerant mode logs and continues

### Environment Processing Pipeline
1. Discover .env files → 2. Read → 3. Parse → 4. Expand variables → 5. Decrypt → 6. Write to process.env

### Convention Support
- `nextjs`: Next.js environment loading order
- `flow`: dotenv-flow convention

## Testing

- **TAP tests**: `npm test` - unit tests with tap framework
- **Shell tests**: `npm run testshell` - integration tests via shellspec
- **Mocking**: proxyquire and sinon for dependency injection
- **Fixtures**: `/tests/monorepo/apps/` for multi-app test scenarios
