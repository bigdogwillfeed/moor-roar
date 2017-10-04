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
  
  function setDomain(domain) {
    $('iframe').attr('src', 'https://' + domain + '.glitch.me/');
    $('#title').text(domain);
    noSpin();
  }
  
  function nextDomain() {
    spin();
    $.get('/domain').then(function(data) {
      setDomain(data);
      }).fail(function(error) {
        console.log(error.statusCode);
        });
  }
  
  $('iframe').on('load', function() {
    $('#static').hide();
  });
  
  $('#channel').click(nextDomain);
  $('#title').on('click', function() {
    window.open('https://glitch.com/~' + this.textContent);
  });
  nextDomain();
});
