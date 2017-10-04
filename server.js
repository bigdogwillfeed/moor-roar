// server.js
// where your node app starts

// init project
var express = require('express'),
    app = express(),
    datastore = require('./datastore'),
    glitch = require('./glitch');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

var clicks = 0

app.get('/domain', function (request, response) {
  clicks++
  if (clicks % 20 === 19) glitch.loadMoar()
  response.send(glitch.getDomain() || 'welcome-project')
})

// thinking about making this more fun / permanent
app.post('/like/:domain/', function (request, response) {
  datastore.set(request.params.domain, 'ok');
  response.send('ok');
});

app.get('/likes', function (request, response) {
  datastore.keys().then(function(keys) {
    response.send(keys);
  });
});

// listen for requests :)
app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + this.address().port);
});