const Session = require('../../db/session')
const PostOauthDeviceCode = require('../api/postOauthDeviceCode')

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
}

module.exports = Login
