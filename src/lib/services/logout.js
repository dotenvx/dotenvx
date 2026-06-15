const Session = require('../../db/session')
const PostLogout = require('../api/postLogout')

class Logout {
  constructor (hostname) {
    this.hostname = hostname
  }

  async run () {
    const sesh = new Session()
    const token = sesh.token()

    const data = await new PostLogout(this.hostname, token).run()

    const id = data.id
    const username = data.username
    const accessToken = data.access_token
    const settingsDevicesUrl = `${this.hostname}/settings/devices`

    sesh.logout(this.hostname, id, accessToken)

    return { username, accessToken, settingsDevicesUrl }
  }
}

module.exports = Logout
