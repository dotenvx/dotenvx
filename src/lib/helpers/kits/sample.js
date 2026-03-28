const SAMPLE_ENV_KIT = `
HELLO="Dotenvx"

# ── Database ─────────────────────────────────────
DATABASE_URL="postgresql://postgres:pass@db.ref.supabase.co:5432/postgres"

# ── Auth ─────────────────────────────────────────
AUTH0_CLIENT_ID="xxxx"
AUTH0_CLIENT_SECRET="xxxx"

# ── AI / LLM ────────────────────────────────────
OPENAI_API_KEY="sk-xxxx"
ANTHROPIC_API_KEY="sk-ant-xxxx"

# ── Email ────────────────────────────────────────
RESEND_API_KEY="re_xxxx"

# ── Cloud Storage ────────────────────────────────
AWS_ACCESS_KEY_ID="xxxx"
AWS_SECRET_ACCESS_KEY="xxxx"

# ── Analytics / Monitoring ───────────────────────
SENTRY_DSN="https://hex@o1234.ingest.us.sentry.io/1234567"

# ── Payments ─────────────────────────────────────
STRIPE_API_KEY="sk_test_xxxx"

# ── Feature Flags ────────────────────────────────
FLAGSMITH_ENV_ID="xxxx"

# ── CI/CD / Deployment ──────────────────────────
VERCEL_TOKEN="vcp_xxxx"
`.trimStart()

module.exports = SAMPLE_ENV_KIT
