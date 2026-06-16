const prompts = require('../helpers/prompts')
const PostKeypair = require('../api/postKeypair')
const keypairMetadata = require('../helpers/keypairMetadata')
const teamChoicesFromMeta = require('../helpers/teamChoicesFromMeta')

const ACCESS_APPROVAL_REQUIRED = 'ACCESS_APPROVAL_REQUIRED'
const ACCESS_APPROVAL_PENDING = 'ACCESS_APPROVAL_PENDING'
const ACCESS_PENDING = 'ACCESS_PENDING'
const POLL_INTERVAL = 1000
const POLL_TIMEOUT = 5 * 60 * 1000

function grantTokenFromError (error) {
  return error.meta && error.meta.grant_token
}

function isAccessApprovalRequired (error) {
  return error.code === ACCESS_APPROVAL_REQUIRED
}

function isAccessPending (error) {
  return error.code === ACCESS_PENDING || error.code === ACCESS_APPROVAL_PENDING
}

function approvalUriFromError (error) {
  if (error.meta) {
    return error.meta.approval_uri
  }

  return error.json && error.json.error && error.json.error.approval_uri
}

async function sleep (ms) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

function approvalTimeoutError () {
  const code = 'ACCESS_APPROVAL_TIMEOUT'
  const error = new Error(`[${code}] approval timed out after 5 minutes`)
  error.code = code
  return error
}

class ArmorKeypair {
  constructor (hostname, token, devicePublicKey, publicKey, options = {}) {
    this.hostname = hostname
    this.token = token
    this.devicePublicKey = devicePublicKey
    this.publicKey = publicKey
    this.team = options.team
    this.envFile = options.envFile || '.env'
    this.metadata = options.metadata
    this.onApprovalRequired = null
  }

  async request (team, metadata, grantToken) {
    if (grantToken !== undefined) {
      return await new PostKeypair(
        this.hostname,
        this.token,
        this.devicePublicKey,
        this.publicKey,
        team,
        metadata,
        grantToken
      ).run()
    }

    return await new PostKeypair(
      this.hostname,
      this.token,
      this.devicePublicKey,
      this.publicKey,
      team,
      metadata
    ).run()
  }

  async requestWithApprovalPolling (team, metadata) {
    try {
      return await this.request(team, metadata)
    } catch (error) {
      if (!isAccessApprovalRequired(error)) {
        throw error
      }

      const grantToken = grantTokenFromError(error)
      if (!grantToken) {
        throw error
      }

      const approvalUri = approvalUriFromError(error)
      if (!approvalUri) {
        throw error
      }

      if (this.onApprovalRequired) {
        this.onApprovalRequired({ approvalUri, code: error.code })
      }

      return await this.poll(team, metadata, grantToken)
    }
  }

  async poll (team, metadata, grantToken) {
    const startedAt = Date.now()

    while (true) {
      try {
        return await this.request(team, metadata, grantToken)
      } catch (error) {
        if (!isAccessPending(error)) {
          throw error
        }

        if (Date.now() - startedAt >= POLL_TIMEOUT) {
          throw approvalTimeoutError()
        }

        await sleep(POLL_INTERVAL)
      }
    }
  }

  async run () {
    const metadata = keypairMetadata(this.envFile, this.metadata)

    if (this.team) {
      return await this.requestWithApprovalPolling(this.team, metadata)
    }

    try {
      return await this.requestWithApprovalPolling(undefined, metadata)
    } catch (error) {
      if (error.code !== 'DOTENVX_TEAM_REQUIRED') {
        throw error
      }

      const choices = teamChoicesFromMeta(error.meta)

      let team = choices[0].value
      if (choices.length > 1) {
        team = await prompts.select({
          message: 'Select team',
          choices
        }, {
          input: process.stdin,
          output: process.stderr
        })
      }

      return await this.requestWithApprovalPolling(team, metadata)
    }
  }
}

module.exports = ArmorKeypair
