function escapeQuotes(value) {
  // Escape inner double quotes and wrap the value in double quotes
  if (value.includes('"')) {
    return `"${value.replace(/"/g, '\\"')}"`
  }

  // If there are single quotes but no double quotes, wrap in double quotes
  return `"${value}"`
}

module.exports = escapeQuotes
