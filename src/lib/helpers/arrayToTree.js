class ArrayToTree {
  constructor (arr) {
    this.arr = arr
  }

  run () {
    const tree = {}

    for (let i = 0; i < this.arr.length; i++) {
      const parts = this.arr[i].split('/')
      let current = tree

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j]
        current[part] = current[part] || {}
        current = current[part]
      }
    }

    return tree
  }
}

module.exports = ArrayToTree
