/* global Map */
// TODO: dynamo disappeared... get new persistent provider
module.exports = (function() {
  const data = new Map()
  
  return {
    set: (key, value) => data.set(key, value),
    get: (key) => data.get(key)
  }
})()