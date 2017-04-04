var params = getParams();
var info = $('#info');
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

// PICKING
map.getContainer().addEventListener('mousemove', function (event) {
  var pixel = {
    x: event.clientX,
    y: event.clientY
  };

  layer.scene.getFeatureAt(pixel).then(function(selection) {
    map.getContainer().style.cursor = (selection && selection.feature)? 'pointer' : 'inherit';
  });
})
 
map.getContainer().addEventListener('click', function (event) {
  var pixel = {
    x: event.clientX,
    y: event.clientY
  };
  info.hide();

  layer.scene.getFeatureAt(pixel).then(function(selection) {
    if (!selection || ! selection.feature) {
      return;
    }
    var feat = selection.feature;
    var label = '';
    if (feat.properties) {
      var sorted = [];
      var count = 0;
      Object.keys(feat.properties).sort().forEach(function(v, i) {
        sorted.push([v, feat.properties[v]]);
        count++;
      });
      label += "layer : " + feat.layers + "<br>";
      for (x in sorted) {
        key = sorted[x][0];
        val = sorted[x][1];
        label += "<div class='labelLine' key='" + key + "' value='" + val + "' onclick='setValuesFromSpan(this)'>" + key + " : " + val + "</div>";
      }
    }
    if (label != '') {
      info.css({
        left: (pixel.x + 5) + 'px',
        top: (pixel.y + 15) + 'px'
      });
      info[0].innerHTML = '<span class="labelInner">' + label + '</span>';
      info.show();
    }
  });
});

