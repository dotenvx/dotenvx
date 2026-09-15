// Keep this policy in sync with Radar's GatewayService::EligibleHeaders.
// Authentication headers (Authorization, X-Api-Key, etc.) are eligible. Routing,
// transport, browser context, cookies and proxy control metadata are not.
const EXCLUDED = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding', 'content-length',
  'te', 'trailer', 'upgrade', 'expect', 'accept-encoding',
  'cookie', 'set-cookie', 'forwarded', 'via', 'referer', 'origin', 'user-agent',
  'x-real-ip', 'x-original-url', 'x-rewrite-url', 'x-http-method-override'
])
const PREFIXES = ['proxy-', 'dotenvx-', 'x-forwarded-', 'sec-']

module.exports = function eligibleHeaders (name) {
  const lower = name.toLowerCase()
  return /^[!#$%&'*+.^_`|~0-9a-z-]+$/.test(lower) &&
    !EXCLUDED.has(lower) && !PREFIXES.some(prefix => lower.startsWith(prefix))
}
