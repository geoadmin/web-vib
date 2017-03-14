(function() {
  function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';

    var map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [7.94, 46.25],
      style: 'mapbox://styles/vib2d/ciz8cl2sr006o2ss3yuhvnn1f',
      // Mapbox zoom differs by one.
      zoom: 8,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });

    // Add a Swissimage layer to the map style.
    map.on('load', function() {
      map.addSource(
        'swissimageWMTS', {
          type: 'raster',
          tiles: ['https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'],
          tileSize: 256
        }
      );
      map.addLayer({
          id: 'swissImage',
          source: 'swissimageWMTS',
          type: 'raster',
        }, 'mapbox-mapbox-satellite');
    });

    map.addControl(new mapboxgl.Navigation({
      position: 'top-right'
    }));
  }

  $(window).load(function() {
    initMap();
  });
})();
