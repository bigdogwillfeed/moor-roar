/* global Map, Set */

module.exports = {
  getDomain: getNextDomain,
  loadMoar: loadMoar
};

var rq = require('request-promise'),
    crypto = require('crypto');

var domains = new Set(),
    cachedDomains = new Map(),
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

const chars = shuffle('abcdefghijklmnopqrstuvwxyz-'.split(''))
var ixChar = -1

function loadMoar() {
  ixChar = (ixChar + 1) % chars.length
  const char = chars[ixChar]
  console.log(`searching for projects containing '${char}'`)
  return rq.get({
    uri:`https://api.glitch.com/projects/search?q=${char}`,
    json:true
  }).then(data => {
    data.sort((a, b) => a.lastAccess > b.lastAccess ? -1 : a.lastAccess > b.lastAccess ? 1 : 0)
    data.forEach(element => domains.add(element.domain))
    console.log(`Found ${domains.size} projects`)
  }).then(() => {
    return [...domains].reduce((pending, domain) => {
      return pending.then(() => getDomainHash(domain).then(hash => cacheDomain(domain, hash)))
    }, Promise.resolve())
  }).then(() => {
    console.log(`Loaded ${cachedDomains.size} projects`)
  }).then(() => console.log('loaded all the domains :)'))
}

loadMoar()

getDomainHash('welcome-project').then(hash => {
  ignoreHashes[hash] = 'current welcome-project'
  console.log('Captured latest welcome-project hash for comparison')
})

var ixChannel = -1

function getNextDomain() {
  if (cachedDomains.size === 0) return
  ixChannel = (ixChannel + 1) % cachedDomains.size
  console.log(`returning ${ixChannel + 1} of ${cachedDomains.size} available`)
  return [...cachedDomains.keys()][ixChannel]
}

function getRandomDomain() {
  let ds = cachedDomains.size > 5 ? [...cachedDomains.keys()] : domains
  var index = Math.floor(Math.random() * ds.length);
  return ds[index];
}

function getDomainHash(domain) {
  // console.log(`checking out ${domain}`)
  return cachedDomains.has(domain) ? Promise.resolve(cachedDomains.get(domain)) : rq({
    uri: `https://${domain}.glitch.me`,
    method: 'GET',
    timeout: 5000,
  }).then(function(data) {
    return crypto.createHash('md5').update(data).digest('hex')
  }).catch(function(err) {
    if (err.name == 'StatusCodeError') {
      // console.log(`${domain} returned ${err.statusCode}`)
    } else if (err.message === 'Error: ESOCKETTIMEDOUT') {
      // console.log(`${domain} timed out... might not be there`)
    } else {
      console.error(err)
    }
    return null
  })
}

function cacheDomain(domain, hash) {
  if (!hash || hash in ignoreHashes) return
  console.log(`${domain} seems cool`)
  cachedDomains.set(domain, hash)
}

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