(function() {

  function addOverlay(map, bodId) {
    if (map.getLayer(app.params.overlay)) {
      map.removeLayer(app.params.overlay);
    }
    map.addLayer(glapi.getWMTSRasterLayer(bodId));
    app.setParam(bodId, 'overlay');
  }

  function localMapConfig(map) {
    // Add all the sources on app start
    var layers = [
      {bodId: 'ch.bafu.moose', timestamp: '20120416'},
      {bodId: 'ch.bafu.auen-vegetationskarten', timestamp: '20150302'},
      {bodId: 'ch.swisstopo.swisstlm3d-wanderwege', timestamp: 'current'},
      {bodId: 'ch.bafu.waldschadenflaechen-lothar', timestamp: '20001001'},
      {bodId: 'ch.bafu.fauna-steinbockkolonien', timestamp: '20150506'}
    ];
    for (var i=0; i < layers.length; i++) {
      map.addSource(glapi.formatSourceName(layers[i].bodId),
        glapi.getWMTSRasterSource(layers[i].bodId, layers[i].timestamp)
      );
    }
    if (app.params.overlay) {
      addOverlay(map, app.params.overlay);
    }
  }

  function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56' +
        'emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';

    app.getParams();
    var map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [app.params.lng, app.params.lat],
      style: 'mapbox://styles/vib2d/cj2btdr0d00532ro5ix21uls4',
      // Mapbox zoom differs by one.
      zoom: app.params.zoom,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });

    map.on('style.load', function(e) {
      localMapConfig(map);
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      app.setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom,
        overlay: app.params.overlay
      });
    });
    glapi.attachMapClickListener(map);
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    return map;
  }

  $(window).load(function() {
    if (!mapboxgl.supported()) {
      // stop and alert user map is not supported
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }

    var map = initMap();
    // Handle background
    var selectedOverlay = $('.vib-overlayselector option[value="' + app.params.overlay + '"]');
    if (selectedOverlay) {
      selectedOverlay.prop('selected', true);
    }
    $('.vib-overlayselector select').change(function() {
      addOverlay(map, this.value);
    });
  });
})();
