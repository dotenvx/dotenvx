const SAMPLE_ENV_KIT = `
# ── Hosting ──────────────────────────────────────
AWS_ACCESS_KEY_ID="encrypted:BD3Z3cTcT19q…"
AWS_SECRET_ACCESS_KEY="encrypted:BGB3QpSQ…"
DATABASE_URL="encrypted:BHyLV2zLhmFa+oEUT…"
VERCEL_TOKEN="encrypted:BLJ/dDf4ZVDAQO5gw…"

# ── AI ───────────────────────────────────────────
OPENAI_API_KEY="encrypted:BFdXru0RVFG/8FZ…"
ANTHROPIC_API_KEY="encrypted:BAMVb8lFZUOr…"

# ── Infrastructure ───────────────────────────────
AUTH0_CLIENT_ID="encrypted:BAY+o7pHeQW1EZ…"
AUTH0_CLIENT_SECRET="encrypted:BKldLhYQ0d…"
RESEND_API_KEY="encrypted:BLr2WEgUnWKjBCL…"
STRIPE_API_KEY="encrypted:BDhqoczaGxtEJ97…"
FLAGSMITH_ENV_ID="encrypted:BHOzl93DYQJ8P…"
SENTRY_DSN="encrypted:BI59ZeVgm3ikKjcgJNa…"
`.trimStart()

module.exports = SAMPLE_ENV_KIT
