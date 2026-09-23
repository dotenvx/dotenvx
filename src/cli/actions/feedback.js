const { logger } = require('../../shared/logger')
const Session = require('../../db/session')
const PostFeedback = require('../../lib/api/postFeedback')
const prompts = require('../../lib/helpers/prompts')
const createSpinner = require('../../lib/helpers/createSpinner')

async function feedback (body) {
  let spinner
  try {
    if (body === undefined) {
      if (!process.stdin.isTTY) {
        throw new Error('provide a message: dotenvx feedback "Your feedback"')
      }

      body = await prompts.input({
        message: 'Send feedback'
      }, { input: process.stdin, output: process.stderr })
    }

    if (!body.trim()) {
      throw new Error('feedback cannot be empty')
    }

    const options = this.opts()
    const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
    const hostname = options.hostname || new Session().hostname()
    spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'sending' })
    await new PostFeedback(hostname, body).run()
    if (spinner) spinner.stop()
    logger.success('✔ Feedback sent, thanks!')
  } catch (error) {
    if (spinner) spinner.stop()
    if (error.code === 'PROMPT_CANCELLED') {
      return { exitCode: 130, error }
    }

    logger.error(error.message || error)
    return { exitCode: 1, error }
  }
}

module.exports = feedback
