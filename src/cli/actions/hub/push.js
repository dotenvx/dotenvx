const ora = require('ora')
const { execSync } = require('child_process')

const logger = require('./../../../shared/logger')
const createSpinner = require('./../../../shared/createSpinner')

const spinner = createSpinner('pushing')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isGitRepository() {
  try {
    // Redirect standard error to null to suppress Git error messages
    const result = execSync('git rev-parse --is-inside-work-tree 2> /dev/null').toString().trim()
    return result === 'true'
  } catch (e) {
    return false
  }
}

function getRemoteOriginUrl() {
  try {
    const url = execSync('git remote get-url origin 2> /dev/null').toString().trim()
    return url
  } catch (error) {
    return null
  }
}

function isGithub(url) {
  return url.includes('github.com')
}

function extractFullName(url) {
  // Removing the protocol part and splitting by slashes and colons
    // Removing the protocol part and .git suffix, then splitting by slashes and colons
  const parts = url.replace(/(^\w+:|^)\/\//, '').replace(/\.git$/, '').split(/[/:]/)

  // Extract the 'username/repository' part
  return parts.slice(-2).join('/')
}

// Create a simple-git instance for the current directory
async function push () {
  spinner.start()
  await sleep(500) // better dx

  if (!isGitRepository()) {
    spinner.fail('oops, must be a git repository')
    logger.warn('try running:')
    logger.warn('  git init .')
    logger.warn('  git add .')
    logger.warn('  git commit -m "Initial commit"')
    process.exit(1)
  }

  const remoteOriginUrl = getRemoteOriginUrl()
  if (!remoteOriginUrl) {
    spinner.fail('oops, must have a remote origin (git remote -v)')
    logger.warn('create it on github and then run:')
    logger.warn('  git remote add origin git@github.com:username/repository.git')
    process.exit(1)
  }

  if (!isGithub(remoteOriginUrl)) {
    spinner.fail('oops, must be a github.com remote origin (git remote -v)')
    logger.warn('create it on github and then run:')
    logger.warn('  git remote add origin git@github.com:username/repository.git')
    logger.warn('')
    logger.warn('need support for other origins? [please tell us](https://github.com/dotenvx/dotenvx/issues')
    process.exit(1)
  }

  const fullName = extractFullName(remoteOriginUrl)

  // make push to api with full_name and succeed if user has access, if not fail

  spinner.succeed(`[${fullName}]`)

  // 3. check if repo is avail to user on hub
  // 4. if not, fail and warn
  // 5. push .env.keys to that repo
}

module.exports = push
