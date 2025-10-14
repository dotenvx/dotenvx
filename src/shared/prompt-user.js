const inquirer = require('inquirer')
const { logger } = require('./logger')

/**
 * Prompts for missing variables dynamically
 * 
 * @author Samuel Vulakh
 * @param {Array} missingVars - Array of objects describing missing variables
 * @param {Object} options - Additional options for the prompts
 * @returns {Promise<Object>} - Object containing the user's answers
 */
async function promptForMissingVars(missingVars, options = {}) {
  if (!missingVars || missingVars.length === 0) {
    return {}
  }

  const questions = []

  for (const varConfig of missingVars) {
    const question = {
      type: varConfig.type || 'input',
      name: varConfig.name,
      message: varConfig.message || `Enter ${varConfig.name}:`,
      ...varConfig
    }

    if (varConfig.validate) {
      question.validate = varConfig.validate
    }

    if (varConfig.default !== undefined) {
      question.default = varConfig.default
    }

    if (varConfig.choices) {
      question.choices = varConfig.choices
    }

    questions.push(question)
  }

  try {
    logger.debug(`prompting`)
    const answers = await inquirer.default.prompt(questions)
    logger.debug(`received answers for: ${Object.keys(answers).join(', ')}`)
    return answers
  } catch (error) {
    logger.debug(`error during prompt: ${error.message}`)
    
    if (error.isTtyError || !process.stdin.isTTY) {
      logger.error('cannot prompt for input: not running in an interactive terminal')
      if (options.helpMessage) {
        logger.error(options.helpMessage)
      }
    } else {
      logger.error('user cancelled input')
    }
    
    if (options.exitOnError !== false) {
      process.exit(1)
    }
    
    throw error
  }
}

/**
 * Prompts for a single variable
 * 
 * @author Samuel Vulakh
 * @param {string} name - Variable name
 * @param {Object} config - Configuration for the prompt
 * @returns {Promise<any>} - The user's answer
 */
async function promptForVar(name, config = {}) {
  const answers = await promptForMissingVars([{
    name,
    ...config
  }], config)
  return answers[name]
}

module.exports = {
  promptForMissingVars,
  promptForVar
}
