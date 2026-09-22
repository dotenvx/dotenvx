// Register public operations here. Internal helpers keep the caller's recorder.
module.exports = {
  'cli/run': {},
  'cli/get': { keyArgument: true },
  'cli/set': { keyArgument: true },
  'cli/del': { keyArgument: true },
  'cli/encrypt': {},
  'cli/decrypt': {},
  'cli/keypair': { keyArgument: true },
  'cli/protect': {},
  'sdk/config': {},
  'sdk/get': { keyArgument: true },
  'sdk/set': { keyArgument: true }
}
