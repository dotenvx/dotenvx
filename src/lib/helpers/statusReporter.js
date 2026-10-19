// Approval instructions must remain visible when spinner output is disabled.
module.exports = function statusReporter (spinner) {
  return text => {
    if (!text) return
    if (spinner) spinner.text = text
    else process.stderr.write(`${text}\n`)
  }
}
