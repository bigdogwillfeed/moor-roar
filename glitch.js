/* global Map, Set */

module.exports = {
  getDomain: getNextDomain,
  loadMoar: loadMoar
};

var ixChannel = -1
// loop through the domains we've checked out and consider to be worth looking at
function getNextDomain() {
  if (cachedDomains.size === 0) return
  if (ixChannel === cachedDomains.size - 1) loadMoar()
  ixChannel = (ixChannel + 1) % cachedDomains.size
  console.log(`returning ${ixChannel + 1} of ${cachedDomains.size} available`)
  return [...cachedDomains.keys()][ixChannel]
}

// ask the Glitch api for some domains, and stash them in the global set for looking at later
function loadMoar() {
  let syllable = randomSyllable()
  return rq.get({
    uri:`https://api.glitch.com/projects/search?q=${syllable}`,
    json:true
  }).then(data => {
    console.log(`Found ${data.length} projects containing '${syllable}'`)
    data.forEach(element => domains.add(element.domain))
  })
}

const rq = require('request-promise'),
      crypto = require('crypto'),
      domains = new Set(),
      cachedDomains = new Map(),
      ignoredDomains = new Map(),
      ignoreHashes = {
        'e93797ed69bbe55a6b46d1ceaa398d3a': '?',
        'de408bcc45e39ab3990327696b36c15c': '404 page',
        'fbf81bddd04d78df31650e4cb572a275': 'welcome-project',
        '50c4a7cea6d2c839322cc86167046f25': 'welcome-project',
        '1b1c45a5f0b61dcac69828d8b620c51d': 'welcome-project from the old domain',
        'daada0ce2e9e1f3805f2e8e78bd5c1d8': 'welcome-project from a while ago',
        '19bf016dbb63f02faf6293d928ffb2f3': 'welcome-project from less time ago',
        'dea442410bbf5e94d22547309a63f57f': 'some other version of the welcome project',
        '2ee3113d75a419f41b96f61083fd5875': 'a version of the welcome-project'
      };

// takes a pass through all the domains we currently know about and caches ones with non-boring hashes of /
function checkDomains() {
  // make a copy first, as loadMoar could be adding to the set as we iterate
  let currentDomains = [...domains]
  console.log(`I know about ${currentDomains.length} domains... taking a peek at each of them`)
  return asyncForEach(currentDomains, pokeDomain)
  .then(() => asyncForEach(currentDomains, (domain) => getDomainHash(domain).then(hash => cacheDomain(domain, hash))))
  .then(() => {
    console.log(`I've been through all ${currentDomains.length} domains and found ${cachedDomains.size} possibly cool ones`)
  })
}

// async, but only start the next after the previous finishes to take it easy on the Glitch container servers
function asyncForEach(arr, fn) {
  return arr.reduce((pending, elt) => pending.then(() => fn(elt)), Promise.resolve())
}

// we figure most of these domains are asleep... so wake them up with a quick HEAD request
// that means we don't have to wait as long when doing the request in getDomainHash
function pokeDomain(domain) {
  if (cachedDomains.has(domain)) return Promise.resolve(cachedDomains.get(domain))
  if (ignoredDomains.has(domain)) return Promise.resolve(ignoredDomains.get(domain))
  return rq({
    uri: `https://${domain}.glitch.me`,
    method: 'HEAD',
    timeout: 500,
  }).catch(function(err) {
    if (!(err.name === 'StatusCodeError' || err.message === 'Error: ESOCKETTIMEDOUT')) {
      console.error(err)
    }
  })
}
  
// download https://{domain}.glitch.me/ and calculate the hash of the response
// there could be other cool stuff at different routes, but how would we know?
function getDomainHash(domain) {
  if (cachedDomains.has(domain)) return Promise.resolve(cachedDomains.get(domain))
  if (ignoredDomains.has(domain)) return Promise.resolve(ignoredDomains.get(domain))
  // console.log(`checking out ${domain}`)
  return rq({
    uri: `https://${domain}.glitch.me`,
    method: 'GET',
    timeout: 2000,
  }).then(function(data) {
    return crypto.createHash('md5').update(data).digest('hex')
  }).catch(function(err) {
    if (err.name == 'StatusCodeError') {
      // console.log(`${domain} returned ${err.statusCode}`)
    } else if (err.message === 'Error: ESOCKETTIMEDOUT') {
      console.log(`${domain} timed out... might not be there. Oh well`)
    } else {
      console.error(err)
    }
    return null
  })
}

function cacheDomain(domain, hash) {
  if (ignoredDomains.has(domain) || cachedDomains.has(domain)) {
    // console.log(`We've already seen ${domain}`)
  } else if (!hash || hash in ignoreHashes) {
    // console.log(`${domain} seems like it is boring`)
    ignoredDomains.set(domain, hash)
  } else if (hash === 'timeout') {
    // don't cache timeouts... let's see if they come to life
  } else {
    console.log(`${domain} seems like it could be cool`)
    cachedDomains.set(domain, hash)
  }
}

var randomSyllable = function() {
  
  const chars = shuffle('bcdfghjklmnpqrstvwxyz'.split(''))
  const vowels = shuffle('aeiouy'.split(''))
  var ixChar = -1
  var ixVowel = -1
  
  /* Fisher-Yates from https://stackoverflow.com/a/6274398/1172663 */
  function shuffle(array) {
      let counter = array.length;

      // While there are elements in the array
      while (counter > 0) {
          // Pick a random index
          let index = Math.floor(Math.random() * counter);

          // Decrease counter by 1
          counter--;

          // And swap the last element with it
          let temp = array[counter];
          array[counter] = array[index];
          array[index] = temp;
      }

      return array;
  }
  
  return function() {
    ixChar = (ixChar + 1) % chars.length
    ixVowel = (ixVowel + 1) % vowels.length
    return shuffle([chars[ixChar], vowels[ixVowel]]).join('')
  }
  
}()

// kick things off when `require`d
loadMoar().then(() => {
  function loop() {
    checkDomains().then(() => setTimeout(loop, 5000))
  }
  loop()
})