// client-side js
// run by the browser each time your view template is loaded

// protip: you can rename this to use .coffee if you prefer

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  
  function spin() {
    $('#title').text('');
    $('.aspect-ratio').scrollTop(0).scrollLeft(0);
    $('#static').show();
    $('#channel').prop('disabled', true).addClass('diabled');
  }
  
  function noSpin() {
    $('#channel').prop('disabled', false).removeClass('diabled');
  }
  
  var sDomain;
  function setDomain(domain) {
    sDomain = domain;
    $('iframe').attr('src', 'https://' + domain + '.glitch.me/');
    $('#title').text(domain);
    noSpin();
    return domain
  }
  
  var fGetInfo = false;
  function toggleInfo() {
    fGetInfo = !fGetInfo
    setInfo(sDomain)
  }
  
  function nextDomain() {
    spin();
    $.get('/domain')
      .then(setDomain).then(setInfo)
      .fail(function(error) {
        console.log(error.statusCode);
      });
  }
  
  function setInfo(domain) {
    $('#info-pane').html('')
    if (!fGetInfo) return
    getInfo(domain)
  }
  
  function getInfo(p) {
    $.get('https://api.glitch.com/projects/' + p)
      .then(data => {
        if (data) {
          addInfo(data.domain)
          if (data.baseId) {
            // keep grabbing remix bases
            return getInfo(data.baseId)
          }
          // linkify the remix outline so we can surf it, too!
          $('#info-pane li').on('click', function() {
            spin();
            setDomain(this.textContent)
          })
        }
      })
      .fail(function(error) {
        console.log(error)
      })
  }
  
  function addInfo(domain) {
    let outline = $('#info-pane').html()
    $('#info-pane').html('<ul><li>' + domain + '</li>' + outline + '</ul>')
  }
  
  $('iframe').on('load', function() {
    $('#static').hide();
  });
  
  $('#channel').click(nextDomain)
  $('#info').click(toggleInfo)
  $('#title').on('click', function() {
    window.open('https://glitch.com/~' + this.textContent)
  })
  nextDomain()
})
