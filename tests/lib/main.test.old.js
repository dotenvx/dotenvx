// const { config, parse, inject } = require('./../../src/lib/main')
// const logger = require('./../../src/shared/logger')
// const dotenv = require('dotenv')
//
// describe('lib/main.js tests', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//   })
//
//   test('config should call dotenv.config with provided options', () => {
//     const options = { path: '.env.test' }
//     config(options)
//     expect(dotenv.config).toHaveBeenCalledWith(options)
//   })
//
//   test('parse should call dotenv.parse and log the result', () => {
//     const src = 'SAMPLE_VAR=SAMPLE_VALUE'
//     const parsedResult = { SAMPLE_VAR: 'SAMPLE_VALUE' }
//     dotenv.parse.mockReturnValue(parsedResult)
//
//     const result = parse(src)
//
//     expect(dotenv.parse).toHaveBeenCalledWith(src)
//     expect(logger.debug).toHaveBeenCalledWith(parsedResult)
//     expect(result).toEqual(parsedResult)
//   })
//
// })
