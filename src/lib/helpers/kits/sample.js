const SAMPLE_ENV_KIT = `
HELLO="Dotenvx"

# ── Hosting ──────────────────────────────────────
AWS_ACCESS_KEY_ID="xxxx"
AWS_SECRET_ACCESS_KEY="xxxx"
DATABASE_URL="postgresql://postgres:pass@db.ref.supabase.co:5432/postgres"
VERCEL_TOKEN="vcp_xxxx"

# ── AI ───────────────────────────────────────────
OPENAI_API_KEY="sk-xxxx"
ANTHROPIC_API_KEY="sk-ant-xxxx"

# ── Infrastructure ───────────────────────────────
AUTH0_CLIENT_ID="xxxx"
AUTH0_CLIENT_SECRET="xxxx"
RESEND_API_KEY="re_xxxx"
STRIPE_API_KEY="sk_test_xxxx"
FLAGSMITH_ENV_ID="xxxx"
SENTRY_DSN="https://hex@o1234.ingest.us.sentry.io/1234567"
`.trimStart()

module.exports = SAMPLE_ENV_KIT
