const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class PostConnectionKeypair {
  constructor (hostname, token, selection, privateKeyName) {
    Object.assign(this, { hostname, token, selection, privateKeyName })
  }

  async run () {
    const { team, connectionId, resourceId } = this.selection
    const response = await http(`${this.hostname}/api/teams/${encodeURIComponent(team)}/connections/${encodeURIComponent(connectionId)}/keypairs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${normalizeToken(this.token)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: resourceId, private_key_name: this.privateKeyName })
    })
    const json = await response.body.json()
    if (response.statusCode >= 400) throw buildApiError(response.statusCode, json)
    return json
  }
}

module.exports = PostConnectionKeypair
