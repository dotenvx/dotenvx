const t = require('tap')

const ArrayToTree = require('../../../src/lib/helpers/arrayToTree')

t.test('#run', ct => {
  const arr = [
    '.env',
    'sub1/.env',
    'sub1/sub2/.env',
    'sub1/sub2/sub3/.env'
  ]
  const tree = new ArrayToTree(arr).run()

  t.same(tree, {
    '.env': {},
    'sub1': {
      'sub2': {
        'sub3': {
          '.env': {}
        },
        '.env': {}
      },
      '.env': {}
    }
  })

  ct.end()
})
