const { config, parse, populate } = require('./../../src/lib/main')
const logger = require('./../../src/shared/logger')
const dotenv = require('dotenv')

// Mocking the logger and dotenv modules
jest.mock('./../../src/shared/logger', () => ({
  debug: jest.fn(),
  verbose: jest.fn()
}))

jest.mock('dotenv', () => ({
  config: jest.fn(),
  parse: jest.fn(),
  populate: jest.fn()
}))

describe('main.js tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('config should call dotenv.config with provided options', () => {
    const options = { path: '.env.test' }
    config(options)
    expect(dotenv.config).toHaveBeenCalledWith(options)
  })

  test('parse should call dotenv.parse and log the result', () => {
    const src = 'SAMPLE_VAR=SAMPLE_VALUE'
    const parsedResult = { SAMPLE_VAR: 'SAMPLE_VALUE' }
    dotenv.parse.mockReturnValue(parsedResult)

    const result = parse(src)

    expect(dotenv.parse).toHaveBeenCalledWith(src)
    expect(logger.debug).toHaveBeenCalledWith(parsedResult)
    expect(result).toEqual(parsedResult)
  })

  test('populate', () => {
    const processEnv = {}
    const parsed = { HELLO: 'World' }

    const result = populate(processEnv, parsed)

    expect([...result.populated]).toEqual(['HELLO'])
  })

  test('populate key already exists', () => {
    const processEnv = { HELLO: 'exists' }
    const parsed = { HELLO: 'World' }

    const result = populate(processEnv, parsed)

    expect([...result.populated]).toEqual([])
    expect([...result.preExisting]).toEqual(['HELLO'])
  })

  test('populate key already exists but overload true', () => {
    const processEnv = { HELLO: 'exists' }
    const parsed = { HELLO: 'World' }
    const overload = true

    const result = populate(processEnv, parsed, overload)

    expect([...result.populated]).toEqual(['HELLO'])
    expect([...result.preExisting]).toEqual([])
  })
})
