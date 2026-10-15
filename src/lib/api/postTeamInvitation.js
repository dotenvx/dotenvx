const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class PostTeamInvitation {
  constructor (hostname, token, team, email) {
    this.hostname = hostname
    this.token = token
    this.team = team
    this.email = email
  }

  async run () {
    const resp = await http(`${this.hostname}/api/teams/${encodeURIComponent(this.team)}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${normalizeToken(this.token)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: this.email, role: 'member' })
    })
    const json = await resp.body.json()
    if (resp.statusCode >= 400) throw buildApiError(resp.statusCode, json)
    return json
  }
}

module.exports = PostTeamInvitation
