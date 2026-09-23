const { logger } = require('../../shared/logger')
const Session = require('../../db/session')
const PostFeedback = require('../../lib/api/postFeedback')
const prompts = require('../../lib/helpers/prompts')

async function feedback (body) {
  try {
    if (body === undefined) {
      if (!process.stdin.isTTY) {
        throw new Error('provide a message: dotenvx feedback "Your feedback"')
      }

      body = await prompts.input({
        message: 'What could we improve? (don’t include secrets)'
      }, { input: process.stdin, output: process.stderr })
    }

    if (!body.trim()) {
      throw new Error('feedback cannot be empty')
    }

    const hostname = this.opts().hostname || new Session().hostname()
    await new PostFeedback(hostname, body).run()
    logger.success('✔ feedback sent. Thank you!')
  } catch (error) {
    if (error.code === 'PROMPT_CANCELLED') {
      return { exitCode: 130, error }
    }

    logger.error(error.message || error)
    return { exitCode: 1, error }
  }
}

module.exports = feedback
