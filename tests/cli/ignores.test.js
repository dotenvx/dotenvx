const { Generic } = require('./../../src/cli/ignores')

const fs = require('fs')

// mocking
jest.mock('fs')

describe('cli/ignores.js tests', () => {
  describe('Generic', () => {
    describe('constructor', () => {
      it('should initialize with the correct values', () => {
        const generic = new Generic('testfile', true)
        expect(generic.filename).toBe('testfile')
        expect(generic.touchFile).toBe(true)
        expect(generic.formats).toEqual(['.env*', '!.env.vault', '.flaskenv*'])
      })
    })

    describe('#append', () => {
      it('should append string to the file', () => {
        const generic = new Generic('testfile')
        const testString = 'test'
        generic.append(testString)
        expect(fs.appendFileSync).toHaveBeenCalledWith('testfile', `\n${testString}`)
      })
    })

    describe('#run', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        fs.existsSync.mockReturnValue(false)
        fs.readFileSync.mockReturnValue('')
      })

      it('should create file if it does not exist and touchFile is true', () => {
        const generic = new Generic('testfile', true)
        generic.run()
        expect(fs.writeFileSync).toHaveBeenCalledWith('testfile', '')
      })

      it('should not create file if it does not exist and touchFile is false', () => {
        const generic = new Generic('testfile', false)
        generic.run()
        expect(fs.writeFileSync).not.toHaveBeenCalled()
      })
    })
  })
})
