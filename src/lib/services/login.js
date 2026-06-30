const Session = require('../../db/session')
const PostOauthDeviceCode = require('../api/postOauthDeviceCode')
const PostOauthToken = require('../api/postOauthToken')

class Login {
  constructor (hostname) {
    this.hostname = hostname
  }

  async run () {
    const sesh = new Session()
    const devicePublicKey = sesh.devicePublicKey()
    const systemInformation = await sesh.systemInformation()

    const data = await new PostOauthDeviceCode(this.hostname, devicePublicKey, systemInformation).run()

    return {
      deviceCode: data.device_code,
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      verificationUriComplete: data.verification_uri_complete,
      interval: data.interval
    }
  }

  async poll (deviceCode, interval) {
    const sesh = new Session()

    while (true) {
      try {
        const data = await new PostOauthToken(this.hostname, deviceCode).run()

        if (data.access_token) {
          sesh.login(this.hostname, data.id, data.username, data.access_token)
          await sesh.notifyUpdate()
          return data
        }

        await new Promise(resolve => setTimeout(resolve, interval * 1000))
      } catch (error) {
        if (error.code === 'authorization_pending') {
          await new Promise(resolve => setTimeout(resolve, (interval + 1) * 1000))
        } else {
          throw error
        }
      }
    }
  }
}

module.exports = Login
