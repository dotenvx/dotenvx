const PostArmorKeyring = require('../api/postArmorKeyring')

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

class ArmorKeyring {
  constructor (hostname, token, devicePublicKey, publicKey) {
    this.hostname = hostname
    this.token = token
    this.devicePublicKey = devicePublicKey
    this.publicKey = publicKey
    this.onApprovalRequired = null
  }

  async request (grantToken) {
    if (grantToken !== undefined) {
      return await new PostArmorKeyring(
        this.hostname,
        this.token,
        this.devicePublicKey,
        this.publicKey,
        grantToken
      ).run()
    }

    return await new PostArmorKeyring(
      this.hostname,
      this.token,
      this.devicePublicKey,
      this.publicKey
    ).run()
  }

  async requestWithApprovalPolling () {
    try {
      return await this.request()
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

      return await this.poll(grantToken)
    }
  }

  async poll (grantToken) {
    const startedAt = Date.now()

    while (true) {
      try {
        return await this.request(grantToken)
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
    return await this.requestWithApprovalPolling()
  }
}

module.exports = ArmorKeyring
