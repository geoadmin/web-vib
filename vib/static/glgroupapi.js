(function() {

  function initCarousel(groups) {
    var layers, layer, i;
    i = 0;
    layers = groups.getAllLayerGroups();
    for(var key in layers) {
      layer = layers[key];
      $('<div class="item">' + layer.label + '</div></div>').appendTo('.carousel-inner');
      $('<li data-target="#layersCarousel" data-slide-to="'+ i +'"></li>')
          .appendTo('.carousel-indicators');
      i += 1;
    }
    $('.item').first().addClass('active');
    $('.carousel-indicators > li').first().addClass('active');
  }

  function initMap() {
    var map, backgroundLayerId;
    backgroundLayerId = 'ch.swisstopo.lightbasemap';
    mapboxgl.accessToken = glapi.accessToken;
    app.getParams();

    map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [app.params.lng, app.params.lat],
      // Mapbox zoom differs by one.
      zoom: app.params.zoom,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });

    map.on('load', function(e) {
      var groups = new glapi.MapLayerGroups(map);
      groups.onReady(function() {
        initCarousel(groups);
        groups.addLayerGroup(backgroundLayerId);
      });
    });

    glapi.getMapStyle().then(function(data) {
      map.setStyle(data);
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
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }
    var map = initMap();
  });
})();
