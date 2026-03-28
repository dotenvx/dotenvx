const SAMPLE_ENV_KIT = `
# ── Database ─────────────────────────────────────
DATABASE_URL="postgresql://postgres:pass@db.ref.supabase.co:5432/postgres"

# ── Auth ─────────────────────────────────────────
AUTH0_CLIENT_ID="q8fij2iug0CmgPLfTfG1tZGdTQyGaTUA"
AUTH0_CLIENT_SECRET="Q5O9hXhVY0aW2sFJ8pL1nD7cR4tG6mK3zP0uE5bS2vN9"

# ── AI / LLM ────────────────────────────────────
OPENAI_API_KEY="sk-xxxx"
ANTHROPIC_API_KEY="sk-ant-xxxx"

# ── Email ────────────────────────────────────────
RESEND_API_KEY="re_xxxx"

# ── Cloud Storage ────────────────────────────────
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# ── Analytics / Monitoring ───────────────────────
SENTRY_DSN="https://hex@o1234.ingest.us.sentry.io/1234567"

# ── Payments ─────────────────────────────────────
STRIPE_API_KEY="sk_test_xxxx"

# ── Feature Flags ────────────────────────────────
FLAGSMITH_ENV_ID="xxxx"

# ── CI/CD / Deployment ──────────────────────────
VERCEL_TOKEN="vcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
`.trimStart()

module.exports = SAMPLE_ENV_KIT
