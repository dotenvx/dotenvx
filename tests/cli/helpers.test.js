const { resolvePath, executeCommand, pluralize, findEnvFiles, guessEnvironment, generateDotenvKey, encrypt, _parseEncryptionKeyFromDotenvKey, changed } = require('./../../src/cli/helpers')

const fs = require('fs')
const crypto = require('crypto')
const logger = require('./../../src/shared/logger')

NONCE_BYTES = 12

// Mocking
jest.mock('fs')
jest.mock('./../../src/shared/logger', () => ({
  debug: jest.fn(),
  verbose: jest.fn()
}))

describe('cli/helpers.js tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('#resolvePath', () => {
    test('uses current working directory', () => {
      const filepath = '.env'

      const result = resolvePath(filepath)

      expect(result).toEqual(`${process.cwd()}/.env`)
    })

    test('it smartly handles paths to files', () => {
      const filepath = 'tests/cli/.env'

      const result = resolvePath(filepath)

      expect(result).toEqual(`${process.cwd()}/tests/cli/.env`)
    })
  })

  describe('#pluralize', () => {
    test('should return plural form for count greater than 1', () => {
      expect(pluralize('cat', 2)).toBe('cats')
      expect(pluralize('dog', 3)).toBe('dogs')
    })

    test('should return plural form for count equal to 0', () => {
      expect(pluralize('apple', 0)).toBe('apples')
    })

    test('should return singular form for count equal to 1', () => {
      expect(pluralize('bird', 1)).toBe('bird')
    })

    test('should handle empty string correctly', () => {
      expect(pluralize('', 1)).toBe('')
      expect(pluralize('', 2)).toBe('s')
    })
  })

  describe('findEnvFiles function', () => {
    test('should return only .env files excluding reserved ones', () => {
      fs.readdirSync.mockReturnValue([
        '.env',
        '.env.local',
        '.env.production',
        '.env.previous',
        'README.md',
        'index.js'
      ])

      const result = findEnvFiles('./')

      expect(result).toEqual(['.env', '.env.local', '.env.production'])
      expect(fs.readdirSync).toHaveBeenCalledWith('./')
    })

    test('should return an empty array if no matching .env files are found', () => {
      fs.readdirSync.mockReturnValue(['README.md', 'index.js'])

      const directory = '/path/to/another/dir'
      const result = findEnvFiles(directory)

      expect(result).toEqual([])
      expect(fs.readdirSync).toHaveBeenCalledWith(directory)
    })
  })

  describe('#guessEnvironment', () => {
    test('should return development for .env', () => {
      expect(guessEnvironment('.env')).toBe('development')
    })

    test('should return correct environment for .env files with specified environment', () => {
      expect(guessEnvironment('.env.production')).toBe('production')
      expect(guessEnvironment('.env.test')).toBe('test')
      expect(guessEnvironment('.env.staging')).toBe('staging')
    })

    test('should handle filenames without dots correctly', () => {
      expect(guessEnvironment('env')).toBe('development')
      expect(guessEnvironment('envproduction')).toBe('development')
    })

    test('should handle filenames with more than two dots correctly', () => {
      expect(guessEnvironment('.env.production.previous')).toBe('production')
      expect(guessEnvironment('.env.test.something')).toBe('test')
    })

    test('should handle empty string correctly', () => {
      expect(guessEnvironment('')).toBe('development')
    })
  })

  describe('#generateDotenvKey', () => {
    test('should generate a key with the correct structure', () => {
      const environment = 'Production'
      const key = generateDotenvKey(environment)
      const pattern = /^dotenv:\/\/:key_[a-f0-9]{64}@dotenvx\.com\/vault\/\.env\.vault\?environment=production$/

      expect(key).toMatch(pattern)
    })

    test('should generate unique keys on each call', () => {
      const environment = 'development'
      const key1 = generateDotenvKey(environment)
      const key2 = generateDotenvKey(environment)

      expect(key1).not.toBe(key2)
    })

    test('should correctly handle different environment inputs', () => {
      const key1 = generateDotenvKey('development')
      const key2 = generateDotenvKey('DEVELOPMENT')
      const key3 = generateDotenvKey('DeVelOpMeNt')

      const pattern = /environment=development$/
      expect(key1).toMatch(pattern)
      expect(key2).toMatch(pattern)
      expect(key3).toMatch(pattern)
    })
  })

  describe('#encrypt', () => {
    const dotenvKey = 'dotenv://:key_aba070f80dae5e9ee0e94de2fd34ba62e698f4449bcfa3a77d5adb0571943129@dotenvx.com/vault/.env.vault?environment=development'
    const key = _parseEncryptionKeyFromDotenvKey(dotenvKey)

    test('should return a base64 encoded string', () => {
      const message = 'Hello, World!'
      const encrypted = encrypt(key, message)

      expect(typeof encrypted).toBe('string')
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow()
    })

    test('should return different outputs for different messages', () => {
      const encrypted1 = encrypt(key, 'Message 1')
      const encrypted2 = encrypt(key, 'Message 2')

      expect(encrypted1).not.toBe(encrypted2)
    })

    test('should return different outputs for different keys', () => {
      const dotenvKey1 = 'dotenv://:key_aba070f80dae5e9ee0e94de2fd34ba62e698f4449bcfa3a77d5adb0571943129@dotenvx.com/vault/.env.vault?environment=development'
      const key1 = _parseEncryptionKeyFromDotenvKey(dotenvKey1)

      const dotenvKey2 = 'dotenv://:key_df14c5eb18086f03a581e212fc9e5677310e3b6e9860cf0bb3572062c3f36f7a@dotenvx.com/vault/.env.vault?environment=production'
      const key2 = _parseEncryptionKeyFromDotenvKey(dotenvKey2)

      const message = 'Hello, World!'

      const encrypted1 = encrypt(key1, message)
      const encrypted2 = encrypt(key2, message)

      expect(encrypted1).not.toBe(encrypted2)
    })

    test('should include nonce and auth tag in the output', () => {
      const message = 'Hello, World!'
      const encrypted = encrypt(key, message)
      const decoded = Buffer.from(encrypted, 'base64').toString('hex')

      // The nonce and auth tag should be part of the decoded string
      expect(decoded.length).toBeGreaterThan(message.length)
      expect(decoded.substr(0, NONCE_BYTES * 2).length).toBe(NONCE_BYTES * 2)
    })
  })
})
