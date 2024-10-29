function conventions (convention) {
  if (convention === 'nextjs') {
    const nodeEnv = process.env.NODE_ENV || 'development'
    const canonicalEnv = ['development', 'test', 'production'].includes(nodeEnv) && nodeEnv

    return [
      canonicalEnv && { type: 'envFile', value: `.env.${canonicalEnv}.local` },
      canonicalEnv !== 'test' && { type: 'envFile', value: '.env.local' },
      canonicalEnv && { type: 'envFile', value: `.env.${canonicalEnv}` },
      { type: 'envFile', value: '.env' }
    ].filter(Boolean)
  } else {
    throw new Error(`INVALID_CONVENTION: '${convention}'. permitted conventions: ['nextjs']`)
  }
}

module.exports = conventions
