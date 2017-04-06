(function() {
  var map, params;

  function permalinkManager(map) {
    return map.on('moveend', function() {
      params = getParams();
      var zoom = map.getView().getZoom();
      var center = map.getView().getCenter();
      setParams({
        x: center[0],
        y: center[1],
        zoom: zoom,
        style: params.style
      });
    });
  }

  function contextManager(map) {
    return map.on('click', function(e) {
      map.forEachFeatureAtPixel(e.pixel, function(feature) {
        var properties = feature.getProperties();
        if (properties) {
          $('.vib-layerid').html(properties.name + ' : ' + properties.layerid);
        }
      }, { hitTolerance: 5 });
    });
  }

  function getStyleUrl(style) {
    var key = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';
    return 'https://api.mapbox.com/styles/v1/vib2d/' + style + '?access_token=' + key;
  }

  function changeMap(map, style) {
    var mvt;
    var layers = map.getLayers().getArray();
    for (var i = 0; i < layers.length; i++) {
      if (layers[i] instanceof ol.layer.VectorTile) {
        mvt = layers[i];
        break;
      }
    }
    if (mvt) {
      $.get(getStyleUrl(style), function(data) {
        olms.applyStyle(mvt, data, 'composite');
        setParam({'style': style});
      })
    }
  }

  function initMap(params) {
    var map = olms.apply('ol-map', getStyleUrl(params.style));
    var wmtsLayer = new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [
          new ol.Attribution({
            html: '<a target="new"' +
            'href = "http://www.swisstopo.admin.ch/' +
            'internet/swisstopo/en/home.html">swisstopo</a>'
          })
        ],
        url: 'https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'
      })
    });
    var view = map.getView();
    var params = getParams();
    view.setCenter([parseFloat(params.x), parseFloat(params.y)]);
    view.setZoom(parseFloat(params.zoom));
    permalinkManager(map);
    contextManager(map);
    map.getLayers().insertAt(0, wmtsLayer);
    return map;
  }

  $(window).load(function() {
    params = getParams();
    map = initMap(params);
    // Handle labels
    //var selectedLayer = $('.vib-layerselector option[value=' + params.style + ']');
    //if (selectedLayer) {
    //  selectedLayer.prop('selected', true);
    //}
    //$('.vib-layerselector select').change(function() {
    //  changeMap(map, this.value);
    //});
  });

})();
