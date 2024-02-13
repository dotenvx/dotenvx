// const { config, parse, inject } = require('./../../src/lib/main')
// const logger = require('./../../src/shared/logger')
// const dotenv = require('dotenv')
//
// // Mocking the logger and dotenv modules
// jest.mock('./../../src/shared/logger', () => ({
//   debug: jest.fn(),
//   verbose: jest.fn()
// }))
//
// jest.mock('dotenv', () => ({
//   config: jest.fn(),
//   parse: jest.fn(),
//   inject: jest.fn()
// }))
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
//   test('inject', () => {
//     const processEnv = {}
//     const parsed = { HELLO: 'World' }
//
//     const result = inject(processEnv, parsed)
//
//     expect([...result.injected]).toEqual(['HELLO'])
//   })
//
//   test('inject key already exists', () => {
//     const processEnv = { HELLO: 'exists' }
//     const parsed = { HELLO: 'World' }
//
//     const result = inject(processEnv, parsed)
//
//     expect([...result.injected]).toEqual([])
//     expect([...result.preExisting]).toEqual(['HELLO'])
//   })
//
//   test('inject key already exists but overload true', () => {
//     const processEnv = { HELLO: 'exists' }
//     const parsed = { HELLO: 'World' }
//     const overload = true
//
//     const result = inject(processEnv, parsed, overload)
//
//     expect([...result.injected]).toEqual(['HELLO'])
//     expect([...result.preExisting]).toEqual([])
//   })
// })
