const SPLIT_REGEX = /#\s*personal\.dotenv\s*/i

function removePersonal (raw) {
  const parts = raw.split(SPLIT_REGEX)

  return parts[0]
}

module.exports = removePersonal
