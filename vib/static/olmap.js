(function() {
  var qString;
  var dftX = 902568.527041534;
  var dftY = 5969980.33812711;
  var dftZoom = 10;

  function getParam(name) {
    return decodeURIComponent(
        (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
            [,""])[1].replace(/\+/g, '%20')) || null;
  }

  function getParams() {
    var x = getParam('x');
    var y = getParam('y');
    var zoom = getParam('zoom');
    return {
      x: x || dftX,
      y: y || dftY,
      zoom: zoom || dftZoom
    };
  }

  function setParams(opts) {
    if (!qString) {
      qString = $.query.set('x', opts.x);
    } else {
      qString = qString.set('x', opts.x);
    }
    qString = qString.set('y', opts.y);
    qString = qString.set('zoom', opts.zoom);
    history.pushState({}, '', window.location.pathname + qString.toString());
  }

  function permalinkManager(map) {
    return map.on('moveend', function() {
      var zoom = map.getView().getZoom();
      var center = map.getView().getCenter();
      setParams({
        x: center[0],
        y: center[1],
        zoom: zoom
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

  function initMap() {
    var key = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';
    var map = olms.apply('ol-map', 'https://api.mapbox.com/styles/v1/vib2d/ciz8cl2sr006o2ss3yuhvnn1f?access_token=' + key);
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
  }

  $(window).load(function() {
    initMap();
  });

})();
