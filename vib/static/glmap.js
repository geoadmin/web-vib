(function() {
  var qString;
  var dftLng = 8.25381975151518;
  var dftLat = 46.77713656930146;
  var dftZoom = 8;

  function getParam(name) {
    return decodeURIComponent(
        (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
            [,""])[1].replace(/\+/g, '%20')) || null;
  }

  function getParams() {
    var lng = getParam('lng');
    var lat = getParam('lat');
    var zoom = getParam('zoom');
    return {
      lng: lng || dftLng,
      lat: lat || dftLat,
      zoom: zoom || dftZoom
    };
  }

  function setParams(opts) {
    if (!qString) {
      qString = $.query.set('lng', opts.lng);
    } else {
      qString = qString.set('lng', opts.lng);
    }
    qString = qString.set('lat', opts.lat);
    qString = qString.set('zoom', opts.zoom);
    history.pushState({}, '', window.location.pathname + qString.toString());
  }

  function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56' +
        'emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';

    var params = getParams();
    var map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [params.lng, params.lat],
      style: 'mapbox://styles/vib2d/ciz8cl2sr006o2ss3yuhvnn1f',
      // Mapbox zoom differs by one.
      zoom: params.zoom,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });

    // Add a Swissimage layer to the map style.
    map.on('load', function() {
      map.addSource(
        'swissimageWMTS', {
          type: 'raster',
          tiles: ['https://wmts10.geo.admin.ch/' +
              '1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'],
          tileSize: 256
        }
      );
      map.addLayer({
          id: 'swissImage',
          source: 'swissimageWMTS',
          type: 'raster',
        }, 'mapbox-mapbox-satellite');
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom
      });
    });

    map.addControl(new mapboxgl.Navigation({
      position: 'top-right'
    }));
    return map;
  }

  $(window).load(function() {
    initMap();
  });
})();
