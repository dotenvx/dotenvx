// Register public operations here. Internal helpers keep the caller's recorder.
module.exports = {
  'cli/run': {},
  'cli/get': { keyArgument: true },
  'cli/set': { keyArgument: true, fileResults: true },
  'cli/del': { keyArgument: true, fileResults: true },
  'cli/encrypt': { fileResults: true },
  'cli/decrypt': { fileResults: true },
  'cli/keypair': { keyArgument: true },
  'cli/protect': {},
  'sdk/config': {},
  'sdk/get': { keyArgument: true },
  'sdk/set': { keyArgument: true }
}
