(function() {

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
    initMap();
  });
})();
