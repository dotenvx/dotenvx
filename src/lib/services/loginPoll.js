const Session = require('../../db/session')
const PostOauthToken = require('../api/postOauthToken')

class LoginPoll {
  constructor (hostname, deviceCode, interval) {
    this.hostname = hostname
    this.deviceCode = deviceCode
    this.interval = interval
  }

  async run () {
    const sesh = new Session()

    while (true) {
      try {
        const data = await new PostOauthToken(this.hostname, this.deviceCode).run()

        if (data.access_token) {
          sesh.login(this.hostname, data.id, data.username, data.access_token)
          await sesh.notifyUpdate()
          return data
        }

        await new Promise(resolve => setTimeout(resolve, this.interval * 1000))
      } catch (error) {
        if (error.code === 'authorization_pending') {
          await new Promise(resolve => setTimeout(resolve, (this.interval + 1) * 1000))
        } else {
          throw error
        }
      }
    }
  }
}

module.exports = LoginPoll
