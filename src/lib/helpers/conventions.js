function conventions (convention) {
  if (convention === 'nextjs') {
    const nodeEnv = process.env.NODE_ENV || 'development'

    const envs = []

    if (['development', 'test', 'production'].includes(nodeEnv)) {
      envs.push({ type: 'envFile', value: `.env.${nodeEnv}.local` })
    }

    if (['development', 'production'].includes(nodeEnv)) {
      envs.push({ type: 'envFile', value: '.env.local' })
    }

    if (['development', 'test', 'production'].includes(nodeEnv)) {
      envs.push({ type: 'envFile', value: `.env.${nodeEnv}` })
    }

    if (['development', 'test', 'production'].includes(nodeEnv)) {
      envs.push({ type: 'envFile', value: '.env' })
    }

    return envs
  } else {
    throw new Error(`INVALID_CONVENTION: '${convention}'. permitted conventions: ['nextjs']`)
  }
}

module.exports = conventions
