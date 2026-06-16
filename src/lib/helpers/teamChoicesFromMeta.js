function teamChoicesFromMeta (meta) {
  return meta.organizations.map(org => ({
    name: org.provider_slug,
    value: org.provider_slug
  }))
}

module.exports = teamChoicesFromMeta
