const path = require('path')
const childProcess = require('child_process')
const { logger } = require('../../shared/logger')

function armorBanner () {
  const lines = [
    '                      [www.dotenvx.com/armor]',
    '–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––',
    '                            __ ____ __ ',
    '                           |    ||    |',
    '                           |  __||__  |',
    '                           |  ‾‾||‾‾  |',
    '                           |    ||    |',
    '                            \\   ||   /',
    '                              \\ __ /',
    '',
    '                          Dotenvx Armor ⛨',
    '',
    '                           ARMORED KEYS',
    '               Private keys. Off device. Under guard.',
    '',
    '                                -',
    '',
    '                            Install one',
    '            [curl -sfS https://dotenvx.sh/armor | sh]',
    '              [npm i @dotenvx/dotenvx-armor --save]',
    '',
    '                                -',
    '',
    '                              Then',
    '                       [dotenvx armor up]',
    '                     (sign in when prompted)',
    ''
  ]

  const innerWidth = Math.max(67, ...lines.map((line) => line.length))
  const top = ` ${'_'.repeat(innerWidth)}`
  const middle = lines.map((line) => `|${line.padEnd(innerWidth)}|`).join('\n')
  const bottom = `|${'_'.repeat(innerWidth)}|`

  return `${top}\n${middle}\n${bottom}`
}

function dynamicAttempts (command, forwardedArgs) {
  if (command === 'vlt') {
    return [
      ['dotenvx-armor', forwardedArgs],
      ['dotenvx-ops', forwardedArgs]
    ]
  }

  if (command === 'ops') {
    return [
      ['dotenvx-armor', forwardedArgs],
      ['dotenvx-ops', forwardedArgs]
    ]
  }

  return [[`dotenvx-${command}`, forwardedArgs]]
}

function executeDynamic (program, command, rawArgs) {
  if (!command) {
    program.outputHelp()
    process.exit(1)
    return
  }

  // construct the full command line manually including flags
  const commandIndex = rawArgs.indexOf(command)
  const forwardedArgs = rawArgs.slice(commandIndex + 1)

  logger.debug(`command: ${command}`)
  logger.debug(`args: ${JSON.stringify(forwardedArgs)}`)

  const binPath = path.join(process.cwd(), 'node_modules', '.bin')
  const newPath = `${binPath}:${process.env.PATH}`
  const env = { ...process.env, PATH: newPath }

  const spawnOptions = { stdio: 'inherit', env }
  let result
  for (const [spawnCommand, spawnArgs] of dynamicAttempts(command, forwardedArgs)) {
    result = childProcess.spawnSync(spawnCommand, spawnArgs, spawnOptions)
    if (!result.error) break
  }

  if (result.error) {
    if (command === 'vlt') {
      console.log(armorBanner())
    } else if (command === 'ops') {
      console.log(armorBanner())
    } else if (command === 'armor') {
      console.log(armorBanner())
    } else {
      logger.info(`error: unknown command '${command}'`)
    }
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

module.exports = executeDynamic
