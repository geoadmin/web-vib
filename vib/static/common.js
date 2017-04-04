var qString;
var dftLng = 8.25381975151518;
var dftLat = 46.77713656930146;
var dftX = 902568.527041534;
var dftY = 5969980.33812711;
var dftZoom = 8;
var dftBackground = 'swissimage';
var dftLang = 'all';

// Mapboxgl
var dftStyle = 'cj12a02uq007z2rqu53z4en4o';

// TangramJS
var dfltScene = 'https://mapzen.com/api/scenes/46449/458/resources/basic.yaml'; 
 
function getParam(name) {
  return decodeURIComponent(
      (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
          [,""])[1].replace(/\+/g, '%20')) || null;
}

function getParams() {
  var lng = getParam('lng');
  var lat = getParam('lat');
  var x = getParam('x');
  var y = getParam('y');
  var zoom = getParam('zoom');
  var style = getParam('style');
  var lang = getParam('lang');
  var background = getParam('background');
  var scene = getParam('scene');
  return {
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
}

function setParam(value, key) {
  if (!qString) {
    qString = $.query.set(key, value);
  } else {
    qString = qString.set(key, value);
  }
  history.pushState({}, '', window.location.pathname + qString.toString());
  params = getParams();
}

function setParams(opts) {
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
  history.pushState({}, '', window.location.pathname + qString.toString());
}

