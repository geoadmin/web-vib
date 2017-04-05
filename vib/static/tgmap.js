var params = getParams();
var info = $('#info');
var map = L.map('map');
var layer = Tangram.leafletLayer({
  scene: params.scene,
  events: {
    hover: function(sel) {
     map.getContainer().style.cursor = (sel && sel.feature)?
          'pointer' : 'move';
    }
  }
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
        label += "<div key='" + key + "' value='" + val + "'>"
            + key + " : " + val + "</div>";
      }
    }
    if (label != '') {
      info.css({
        left: (pixel.x + 5) + 'px',
        top: (pixel.y + 15) + 'px'
      });
      info[0].innerHTML = '<span>' + label + '</span>';
      info.show();
    }
  });
});


layer.on('init', function() {
  // MODIFY PROPERTY OF LABELS LAYER
  var props = $('#properties');
  var labels = layer.scene.config.layers.labels;
  
  Object.keys(labels).forEach(function(key) {
    var l = labels[key];
    if (!l.filter || !l.filter.objektart) {
      return;
    }
    // Priority only apply to point and text styles
    var style = l.draw.points || l.draw.text;
    var container  = $('<div><div>' + key + ' (type:' + l.filter.objektart + ')</div></div>');
    props.append(container);
    
    // PRIORITY
    if (style.priority !== undefined) {
      var labelP = $('<label><a href="https://mapzen.com/documentation/tang' +
          'ram/draw/#priority"> Priority</a>: </label>');
      var inputP = $('<input type="number" id="' + key + 'Input" key="priority" value="' +
          style.priority + '"/>').on('keyup change', function() {
        style.priority = parseInt(this.value, 10) || 0;
      });
      container.append(labelP);
      container.append(inputP);
    } 

    // ORDER
    if (style.order !== undefined) {
      var labelO  = $('<label><a href="https://mapzen.com/documentation/tang' +
          'ram/draw/#order">Order</A>: </label>');
      var inputO = $('<input type="number" id="' + key +
          'Input" key="order" value="' + style.order +
          '"/>').on('keyup change', function() {
        style.order = parseInt(this.value, 10) || 0;
      });

      container.append(labelO);
      container.append(inputO);
    } 
  });
  
  var bt = $('<button>Apply Changes</button>').on('click', function() {
    layer.scene.updateConfig();
  });
  props.append(bt);
});

