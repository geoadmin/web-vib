var app = {};

(function() {
  var qString;
  var dftLng = 8.25381975151518;
  var dftLat = 46.77713656930146;
  var dftX = 902568.527041534;
  var dftY = 5969980.33812711;
  var dftZoom = 8;
  var dftBackground = 'swissimage';
  var dftLang = 'all';
  // Mapboxgl
  var dftStyle = 'cj168d2g500482rqm988ycycc';
  // TangramJS
  var dfltScene = 'https://mapzen.com/api/scenes/46449/465/resources/basic.yaml';

  app.params = {};

  app.getParam = function(name) {
    return decodeURIComponent(
        (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
            [,""])[1].replace(/\+/g, '%20')) || null;
  };

  app.getParams = function() {
    var lng = app.getParam('lng');
    var lat = app.getParam('lat');
    var x = app.getParam('x');
    var y = app.getParam('y');
    var zoom = app.getParam('zoom');
    var style = app.getParam('style');
    var lang = app.getParam('lang');
    var background = app.getParam('background');
    var scene = app.getParam('scene');
    var params = {
      lng: lng || dftLng,
      lat: lat || dftLat,
      zoom: zoom || dftZoom,
      lang: lang || dftLang,
      x: x || dftX,
      y: y || dftY,
      style: style || dftStyle,
      lang: lang || dftLang,
      background: background || dftBackground,
      scene: scene || dfltScene
    };
    app.setParams(params);
    return app.params;
  };

  app.setParam = function(value, key) {
    if (!qString) {
      qString = $.query.set(key, value);
    } else {
      qString = qString.set(key, value);
    }
    app.params[key] = value;
    history.pushState({}, '', window.location.pathname + qString.toString());
  };

  app.setParams = function(opts) {
    if (!qString) {
      qString = $.query.set('lng', opts.lng);
    } else {
      qString = qString.set('lng', opts.lng);
    }
    qString = qString.set('lat', opts.lat);
    qString = qString.set('x', opts.x);
    qString = qString.set('y', opts.y);
    qString = qString.set('zoom', opts.zoom);
    qString = qString.set('style', opts.style);
    qString = qString.set('lang', opts.lang);
    qString = qString.set('background', opts.background);
    $.extend(app.params, opts);
    history.pushState({}, '', window.location.pathname + qString.toString());
  };
})();
