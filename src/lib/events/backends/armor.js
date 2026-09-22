const Session = require('../../../db/session')
const { http } = require('../../helpers/http')

// Radar ingests client-reported activity at POST /api/events.
// Authentication is captured before `run` loads application environment values.
module.exports = function armor (options = {}) {
  if (process.env.DOTENVX_NO_ARMOR === 'true' || options.armor === false || options.noArmor === true) return
  const session = new Session()
  if (!options.token && (!session.on() || !session.username())) return
  const token = options.token || session.token()
  if (!token) return
  const hostname = session.hostname()

  return {
    id: 'armor',
    async send (events, { signal }) {
      const response = await http(`${hostname}/api/events`, {
        method: 'POST',
        signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
      // No response data belongs in console output (including errors).
      response.body.destroy()
      if (response.statusCode >= 400) throw new Error('Event delivery failed')
    }
  }
}
