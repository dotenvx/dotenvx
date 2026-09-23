const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')

class PostFeedback {
  constructor (hostname, body) {
    this.hostname = hostname
    this.body = body
  }

  async run () {
    const url = `${this.hostname}/api/feedback`

    const resp = await http(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: this.body })
    })

    const json = await resp.body.json()

    if (resp.statusCode >= 400) {
      throw buildApiError(resp.statusCode, json)
    }

    return json
  }
}

module.exports = PostFeedback
