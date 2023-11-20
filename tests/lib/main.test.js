const { config, parse, populate } = require('./../../src/lib/main')
const logger = require('./../../src/shared/logger')
const dotenv = require('dotenv')

// Mocking the logger and dotenv modules
jest.mock('./../../src/shared/logger', () => ({
  debug: jest.fn()
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

  test('populate should call dotenv.populate and log process.env', () => {
    const processEnv = {}
    const parsed = { SAMPLE_VAR: 'SAMPLE_VALUE' }
    const options = {}

    populate(processEnv, parsed, options)

    expect(dotenv.populate).toHaveBeenCalledWith(processEnv, parsed, options)
    expect(logger.debug).toHaveBeenCalledWith(process.env)
  })
})
