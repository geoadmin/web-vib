var params = getParams();
var map = L.map('map');

var layer = Tangram.leafletLayer({
  scene: params.scene
});
layer.addTo(map);
map.setView([params.lat, params.lng], params.zoom);
map.on('moveend', function() {
  var center = map.getCenter();
  var zoom = map.getZoom();
  var scene = layer.scene.config_source;
  setParam(center.lat, 'lat');
  setParam(center.lng, 'lng');
  setParam(zoom, 'zoom');
  setParam(scene, 'scene');
  $('#mapzenLink')[0].href = 'https://mapzen.com/tangram/play/?scene=' + 
      encodeURIComponent(scene) +
      '#' + zoom + '/' + center.lat + '/' + center.lng;
});

