function mono () {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const packageName = process.env.PACKAGE_NAME
  const maxDepth = parseInt(process.env.MAX_DEPTH) >= 0 ? process.env.MAX_DEPTH : 2
  const cwd = process.env.CWD || '.'
  console.log('environment variables', {
    cwd,
    nodeEnv,
    packageName,
    maxDepth
  })
  const templateEnvs = [
    { type: 'envFile', value: '.env' },
    { type: 'envFile', value: '.env.local' }
  ]

  if (nodeEnv !== undefined) {
    templateEnvs.push({ type: 'envFile', value: `.env.${nodeEnv}` })
    templateEnvs.push({ type: 'envFile', value: `.env.${nodeEnv}.local` })
  }
  if (packageName !== undefined) {
    templateEnvs.push({ type: 'envFile', value: `.env.${packageName}` })
    templateEnvs.push({ type: 'envFile', value: `.env.${packageName}.local` })
    if (nodeEnv !== undefined) {
      templateEnvs.push({ type: 'envFile', value: `.env.${packageName}.${nodeEnv}` })
      templateEnvs.push({ type: 'envFile', value: `.env.${packageName}.${nodeEnv}.local` })
    }
  }
  const envs = []
  for (let i = 0; i <= maxDepth; i++) {
    const path = '../'.repeat(i)
    envs.unshift(...templateEnvs.map((env) => {
      return {
        ...env,
        value: `${cwd}/${path}${env.value}`
      }
    }))
  }

  return envs
}

module.exports = mono
